import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loading } from '../components/ui'
import { api } from '../services/api'
import { authorizeRealtime, realtime } from '../services/realtime'
import type { Game, Match, Profile, TournamentDetail, TournamentGame } from '../types/domain'

const stageName = (match: Pick<Match, 'stage' | 'round'>) => match.stage === 'knockout' ? `Knockout · Round ${match.round}` : ({ league: `League · Round ${match.round}`, qualifier1: 'Qualifier 1', eliminator: 'Eliminator', qualifier2: 'Qualifier 2', final: 'Final' }[match.stage] || match.stage)
const gameResult = (game: TournamentGame) => game.status !== 'finished' ? 'Live now' : game.result === '1/2-1/2' ? 'Draw' : game.result === '1-0' ? `${game.white_username} won` : `${game.black_username} won`

export function TournamentPage({ profile }: { profile: Profile }) {
  const { id } = useParams()
  const [tournament, setTournament] = useState<TournamentDetail | null>(null)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const load = () => api<TournamentDetail>(`/tournaments/${id}`).then(setTournament).catch((cause) => setMessage(cause.message))
  useEffect(() => {
    void load(); const client = realtime
    if (!client || !id) return
    void authorizeRealtime().then(() => client.channel(`tournament-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_matches', filter: `tournament_id=eq.${id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_participants', filter: `tournament_id=eq.${id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${id}` }, load)
      .subscribe())
    return () => { void client.removeAllChannels() }
  }, [id])
  if (!tournament) return <Loading message={message || 'Preparing the bracket…'} />
  async function ready(matchId: string) {
    const data = await api<{ game: Game | null; waiting: boolean }>(`/tournament-matches/${matchId}/ready`, { method: 'POST' })
    if (data.game) navigate(`/games/${data.game.id}`); else setMessage('You are ready. The game starts when your opponent is ready too.')
  }
  const grouped = tournament.matches.reduce<Record<string, Match[]>>((result, match) => { (result[`${match.stage}-${match.round}`] ??= []).push(match); return result }, {})
  return <><section className="tournament-head"><div><p className="eyebrow">{tournament.format === 'ipl' ? 'FULL IPL TOURNAMENT' : 'SHORT KNOCKOUT'}</p><h1>{tournament.name}</h1></div><span className={`status-stamp ${tournament.status}`}>{tournament.status}</span></section>{message && <p className="form-message">{message}</p>}
    {tournament.format === 'ipl' && <section className="standings"><h2>League table</h2><p className="section-note">Win 2 points · Draw 1 point · Top four reach the playoffs</p><div className="table"><div className="table-head"><span>#</span><span>Player</span><span>W</span><span>PTS</span></div>{tournament.participants.map((player, index) => <div key={player.user_id}><span>{index + 1}</span><b>{player.username}</b><span>{player.wins}</span><strong>{player.points}</strong></div>)}</div></section>}
    <section className="bracket-section"><h2>{tournament.format === 'ipl' ? 'Fixtures & playoffs' : 'The bracket'}</h2><p className="section-note">Select “I’m ready” when your assigned match is available.</p><div className="bracket-scroll"><div className="bracket">{Object.entries(grouped).map(([group, matches]) => <div className="bracket-round" key={group}><h3>{stageName(matches[0])}</h3>{matches.map((match) => <article className={`match-slip ${match.status}`} key={match.id}><p><span>{match.player1_username}</span>{match.winner_id === match.player1_id && <b>WIN</b>}</p><p><span>{match.player2_username}</span>{match.winner_id === match.player2_id && <b>WIN</b>}</p><footer><small>{match.status}</small>{match.game_id && <Link to={`/games/${match.game_id}`}>Open game</Link>}{match.status === 'ready' && [match.player1_id, match.player2_id].includes(profile.id) && <button onClick={() => ready(match.id)}>I’m ready</button>}</footer></article>)}</div>)}</div></div></section>
    <section className="review-archive"><div className="review-heading"><div><p className="eyebrow dark">{tournament.viewer_is_owner ? 'OWNER REVIEW DESK' : 'MATCH ARCHIVE'}</p><h2>Every game, every move.</h2></div><p>{tournament.games.length} game{tournament.games.length === 1 ? '' : 's'} recorded</p></div>
      <div className="review-list">{tournament.games.map((game, index) => <Link to={`/games/${game.id}`} key={game.id}><span className="review-number">{String(index + 1).padStart(2, '0')}</span><div><b>{game.white_username} <em>vs</em> {game.black_username}</b><small>{stageName(game)} · {gameResult(game)}</small></div><strong>{game.status === 'finished' ? 'Review →' : 'Watch live →'}</strong></Link>)}{tournament.games.length === 0 && <p className="archive-empty">Games will appear here as soon as the first match starts.</p>}</div>
    </section>
  </>
}
