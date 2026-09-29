import { db } from '../../config/database.js'
import { AppError } from '../../shared/http.js'
import { settleTournamentGame } from '../tournaments/tournament.service.js'
import type { z } from 'zod'
import type { moveSchema } from './game.schema.js'
import { restoreGame } from './game.engine.js'

export async function getGame(userId: string, gameId: string) {
  const [game] = await db`
    select g.*, w.username as white_username, b.username as black_username,
      case when g.white_id = ${userId} then 'white'
        when g.black_id = ${userId} then 'black' else 'spectator' end as viewer_role
    from games g join profiles w on w.id = g.white_id join profiles b on b.id = g.black_id
    where g.id = ${gameId} and (
      ${userId} in (g.white_id, g.black_id)
      or exists (
        select 1 from tournament_matches tm
        join tournaments t on t.id = tm.tournament_id
        join club_members cm on cm.club_id = t.club_id
        where tm.id = g.tournament_match_id and cm.user_id = ${userId}
      )
    )
  `
  if (!game) throw new AppError('Game not found', 404)
  const moves = await db`
    select ply, san, from_square, to_square, fen_after, white_ms, black_ms, played_at
    from game_moves where game_id = ${game.id} order by ply
  `
  return { ...game, moves }
}

export async function submitMove(userId: string, gameId: string, input: z.infer<typeof moveSchema>) {
  return db.begin(async (transaction) => {
    const [current] = await transaction`select * from games where id = ${gameId} for update`
    if (!current || ![current.white_id, current.black_id].includes(userId)) throw new AppError('Game not found', 404)
    if (current.status !== 'active') throw new AppError('This game is finished', 409)
    if (current.version !== input.version) throw new AppError('Board changed; reload the position', 409)
    const chess = restoreGame(current.fen, current.pgn)
    const movingId = chess.turn() === 'w' ? current.white_id : current.black_id
    if (movingId !== userId) throw new AppError('Wait for your turn', 409)
    const elapsed = Date.now() - new Date(current.last_move_at).getTime()
    const whiteMs = chess.turn() === 'w' ? current.white_ms - elapsed : current.white_ms
    const blackMs = chess.turn() === 'b' ? current.black_ms - elapsed : current.black_ms
    if (whiteMs <= 0 || blackMs <= 0) throw new AppError('Your clock has expired', 409)
    let move
    try { move = chess.move(input) } catch { throw new AppError('That move is not legal') }
    const status = chess.isGameOver() ? 'finished' : 'active'
    const result = chess.isCheckmate() ? (chess.turn() === 'w' ? '0-1' : '1-0') : chess.isDraw() ? '1/2-1/2' : null
    const [updated] = await transaction`
      update games set fen = ${chess.fen()}, pgn = ${chess.pgn()}, white_ms = ${Math.max(0, whiteMs)},
        black_ms = ${Math.max(0, blackMs)}, last_move = ${input.from + input.to + input.promotion},
        last_move_at = now(), version = version + 1, status = ${status}, result = ${result},
        finished_at = ${status === 'finished' ? new Date() : null}
      where id = ${current.id} returning *
    `
    await transaction`
      insert into game_moves (game_id, ply, san, from_square, to_square, fen_after, white_ms, black_ms)
      values (${current.id}, ${current.version + 1}, ${move.san}, ${move.from}, ${move.to}, ${chess.fen()}, ${Math.max(0, whiteMs)}, ${Math.max(0, blackMs)})
    `
    if (status === 'finished') await settleTournamentGame(transaction, updated)
    return updated
  })
}

export async function resignGame(userId: string, gameId: string) {
  return db.begin(async (transaction) => {
    const [current] = await transaction`select * from games where id = ${gameId} for update`
    if (!current || ![current.white_id, current.black_id].includes(userId)) throw new AppError('Game not found', 404)
    if (current.status !== 'active') return current
    const result = userId === current.white_id ? '0-1' : '1-0'
    const [updated] = await transaction`update games set status = 'finished', result = ${result}, finished_at = now(), version = version + 1 where id = ${current.id} returning *`
    await settleTournamentGame(transaction, updated)
    return updated
  })
}

export async function claimTimeout(userId: string, gameId: string) {
  return db.begin(async (transaction) => {
    const [current] = await transaction`select * from games where id = ${gameId} for update`
    if (!current || ![current.white_id, current.black_id].includes(userId)) throw new AppError('Game not found', 404)
    if (current.status !== 'active') return current
    const chess = restoreGame(current.fen, current.pgn)
    const elapsed = Date.now() - new Date(current.last_move_at).getTime()
    const remaining = (chess.turn() === 'w' ? current.white_ms : current.black_ms) - elapsed
    if (remaining > 0) throw new AppError('The clock is still running', 409)
    const result = chess.turn() === 'w' ? '0-1' : '1-0'
    const [updated] = await transaction`update games set status = 'finished', result = ${result}, finished_at = now(), version = version + 1 where id = ${current.id} returning *`
    await settleTournamentGame(transaction, updated)
    return updated
  })
}
