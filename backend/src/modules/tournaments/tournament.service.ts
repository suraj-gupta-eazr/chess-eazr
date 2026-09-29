import { db, type Transaction } from '../../config/database.js'
import { AppError } from '../../shared/http.js'
import { knockoutPairings, leaguePairings } from './tournament.engine.js'

export async function createTournament(userId: string, clubId: string, input: { name: string; format: 'short' | 'ipl'; playerIds: string[] }) {
  if (new Set(input.playerIds).size !== input.playerIds.length) throw new AppError('Select each player once')
  if (input.format === 'short' && ![4, 8, 16].includes(input.playerIds.length)) throw new AppError('Short tournaments require 4, 8, or 16 players')
  const [club] = await db`select id from clubs where id = ${clubId} and owner_id = ${userId}`
  if (!club) throw new AppError('Only the club owner can create tournaments', 403)
  const [{ count }] = await db`select count(*)::int from club_members where club_id = ${club.id} and user_id = any(${input.playerIds}::uuid[])`
  if (count !== input.playerIds.length) throw new AppError('Every player must be a club member')
  return db.begin(async (transaction) => {
    const [tournament] = await transaction`
      insert into tournaments (club_id, name, format, created_by)
      values (${club.id}, ${input.name}, ${input.format}, ${userId}) returning *
    `
    await transaction`insert into tournament_participants ${db(input.playerIds.map((playerId, seed) => ({ tournament_id: tournament.id, user_id: playerId, seed })))} `
    return tournament
  })
}

export async function startTournament(userId: string, tournamentId: string) {
  return db.begin(async (transaction) => {
    const [tournament] = await transaction`
      select t.* from tournaments t join clubs c on c.id = t.club_id
      where t.id = ${tournamentId} and c.owner_id = ${userId} for update
    `
    if (!tournament) throw new AppError('Tournament not found', 404)
    if (tournament.status !== 'draft') throw new AppError('Tournament has already started', 409)
    const players = await transaction`select user_id from tournament_participants where tournament_id = ${tournament.id}`
    const ids = players.map((player) => player.user_id as string)
    const pairings = tournament.format === 'short' ? knockoutPairings(ids) : leaguePairings(ids)
    const stage = tournament.format === 'short' ? 'knockout' : 'league'
    for (const pairing of pairings) await transaction`
      insert into tournament_matches (tournament_id, stage, round, position, player1_id, player2_id, status)
      values (${tournament.id}, ${stage}, ${pairing.round}, ${pairing.position}, ${pairing.player1Id}, ${pairing.player2Id}, ${pairing.round === 1 ? 'ready' : 'locked'})
    `
    await transaction`update tournaments set status = 'active', started_at = now() where id = ${tournament.id}`
    return { ...tournament, status: 'active' }
  })
}

export async function getTournament(userId: string, tournamentId: string) {
  const [tournament] = await db`
    select t.*, c.owner_id as club_owner_id, (c.owner_id = ${userId}) as viewer_is_owner
    from tournaments t join clubs c on c.id = t.club_id
    where t.id = ${tournamentId} and exists (
      select 1 from club_members where club_id = t.club_id and user_id = ${userId}
    )
  `
  if (!tournament) throw new AppError('Tournament not found', 404)
  const [participants, matches, games] = await Promise.all([
    db`select tp.*, p.name, p.username from tournament_participants tp join profiles p on p.id = tp.user_id where tp.tournament_id = ${tournament.id} order by tp.points desc, tp.wins desc, tp.seed`,
    db`select tm.*, p1.username as player1_username, p2.username as player2_username, w.username as winner_username from tournament_matches tm join profiles p1 on p1.id = tm.player1_id join profiles p2 on p2.id = tm.player2_id left join profiles w on w.id = tm.winner_id where tm.tournament_id = ${tournament.id} order by tm.round, tm.position`,
    db`
      select g.id, g.status, g.result, g.created_at, g.started_at, g.finished_at,
        g.white_id, g.black_id, w.username as white_username, b.username as black_username,
        tm.id as match_id, tm.stage, tm.round, tm.position
      from games g
      join tournament_matches tm on tm.id = g.tournament_match_id
      join profiles w on w.id = g.white_id
      join profiles b on b.id = g.black_id
      where tm.tournament_id = ${tournament.id}
      order by tm.round, tm.position, g.created_at
    `,
  ])
  return { ...tournament, participants, matches, games }
}

export async function readyForMatch(userId: string, matchId: string) {
  return db.begin(async (transaction) => {
    const [match] = await transaction`select * from tournament_matches where id = ${matchId} for update`
    if (!match || ![match.player1_id, match.player2_id].includes(userId)) throw new AppError('Match not found', 404)
    if (match.game_id) return (await transaction`select * from games where id = ${match.game_id}`)[0]
    const field = userId === match.player1_id ? 'player1_ready_at' : 'player2_ready_at'
    await transaction.unsafe(`update tournament_matches set ${field} = now() where id = $1`, [match.id])
    const [ready] = await transaction`select * from tournament_matches where id = ${match.id}`
    if (!ready.player1_ready_at || !ready.player2_ready_at) return null
    const white = ready.attempt % 2 === 0 ? ready.player1_id : ready.player2_id
    const black = white === ready.player1_id ? ready.player2_id : ready.player1_id
    const [game] = await transaction`
      insert into games (white_id, black_id, tournament_match_id, status, started_at, last_move_at)
      values (${white}, ${black}, ${ready.id}, 'active', now(), now()) returning *
    `
    await transaction`update tournament_matches set game_id = ${game.id}, status = 'playing' where id = ${ready.id}`
    return game
  })
}

export async function settleTournamentGame(transaction: Transaction, game: Record<string, any>) {
  if (!game.tournament_match_id) return
  const [match] = await transaction`select * from tournament_matches where id = ${game.tournament_match_id} for update`
  if (!match || match.status === 'finished') return
  if (game.result === '1/2-1/2' && match.stage !== 'league') {
    await transaction`update tournament_matches set game_id = null, status = 'ready', attempt = attempt + 1, player1_ready_at = null, player2_ready_at = null where id = ${match.id}`
    return
  }
  const winner = game.result === '1-0' ? game.white_id : game.result === '0-1' ? game.black_id : null
  const loser = winner ? (winner === match.player1_id ? match.player2_id : match.player1_id) : null
  await transaction`update tournament_matches set status = 'finished', winner_id = ${winner}, loser_id = ${loser} where id = ${match.id}`
  if (match.stage === 'league') {
    if (winner) await transaction`update tournament_participants set points = points + 2, wins = wins + 1 where tournament_id = ${match.tournament_id} and user_id = ${winner}`
    else await transaction`update tournament_participants set points = points + 1 where tournament_id = ${match.tournament_id} and user_id in (${match.player1_id}, ${match.player2_id})`
  }
  await advanceTournament(transaction, match.tournament_id, match.stage, match.round)
}

async function advanceTournament(transaction: Transaction, tournamentId: string, stage: string, round: number) {
  const unfinished = await transaction`select 1 from tournament_matches where tournament_id = ${tournamentId} and stage = ${stage} and round = ${round} and status != 'finished' limit 1`
  if (unfinished.length) return
  if (stage === 'knockout') {
    const winners = await transaction`select winner_id from tournament_matches where tournament_id = ${tournamentId} and stage = 'knockout' and round = ${round} order by position`
    if (winners.length === 1) { await transaction`update tournaments set status = 'finished', finished_at = now() where id = ${tournamentId}`; return }
    for (let position = 0; position < winners.length / 2; position++) await transaction`
      insert into tournament_matches (tournament_id, stage, round, position, player1_id, player2_id, status)
      values (${tournamentId}, 'knockout', ${round + 1}, ${position}, ${winners[position * 2].winner_id}, ${winners[position * 2 + 1].winner_id}, 'ready')
    `
    return
  }
  if (stage === 'league') {
    const laterRounds = await transaction`select 1 from tournament_matches where tournament_id = ${tournamentId} and stage = 'league' and round > ${round} limit 1`
    if (laterRounds.length) { await transaction`update tournament_matches set status = 'ready' where tournament_id = ${tournamentId} and stage = 'league' and round = ${round + 1}`; return }
    const top = await transaction`select user_id from tournament_participants where tournament_id = ${tournamentId} order by points desc, wins desc, seed limit 4`
    await transaction`insert into tournament_matches (tournament_id, stage, round, position, player1_id, player2_id, status) values (${tournamentId}, 'qualifier1', 1, 0, ${top[0].user_id}, ${top[1].user_id}, 'ready'), (${tournamentId}, 'eliminator', 1, 1, ${top[2].user_id}, ${top[3].user_id}, 'ready')`
    return
  }
  if (stage === 'qualifier1' || stage === 'eliminator') {
    const [qualifier] = await transaction`select * from tournament_matches where tournament_id = ${tournamentId} and stage = 'qualifier1' and status = 'finished'`
    const [eliminator] = await transaction`select * from tournament_matches where tournament_id = ${tournamentId} and stage = 'eliminator' and status = 'finished'`
    if (qualifier && eliminator) await transaction`insert into tournament_matches (tournament_id, stage, round, position, player1_id, player2_id, status) values (${tournamentId}, 'qualifier2', 2, 0, ${qualifier.loser_id}, ${eliminator.winner_id}, 'ready') on conflict do nothing`
    return
  }
  if (stage === 'qualifier2') {
    const [qualifier1] = await transaction`select winner_id from tournament_matches where tournament_id = ${tournamentId} and stage = 'qualifier1'`
    const [qualifier2] = await transaction`select winner_id from tournament_matches where tournament_id = ${tournamentId} and stage = 'qualifier2'`
    await transaction`insert into tournament_matches (tournament_id, stage, round, position, player1_id, player2_id, status) values (${tournamentId}, 'final', 3, 0, ${qualifier1.winner_id}, ${qualifier2.winner_id}, 'ready') on conflict do nothing`
    return
  }
  if (stage === 'final') await transaction`update tournaments set status = 'finished', finished_at = now() where id = ${tournamentId}`
}
