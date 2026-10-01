import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loading } from '../components/ui'
import { api } from '../services/api'
import type { GameSummary } from '../types/domain'

function outcome(game: GameSummary) {
  if (game.status === 'active') return 'Live'
  if (game.result === '1/2-1/2') return 'Draw'
  const won = (game.viewer_role === 'white' && game.result === '1-0') || (game.viewer_role === 'black' && game.result === '0-1')
  return won ? 'Won' : 'Lost'
}

export function HistoryPage() {
  const [games, setGames] = useState<GameSummary[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { void api<GameSummary[]>('/games').then(setGames).catch((cause) => setError(cause.message)) }, [])
  if (!games) return <Loading message={error || 'Opening your scorebook…'} />

  return <section className="history-page">
    <header className="page-title"><div><p className="eyebrow dark">YOUR SCOREBOOK</p><h1>Game history</h1></div><p>Every game stays available<br />for replay and review.</p></header>
    <div className="history-ledger">{games.map((game, index) => {
      const opponent = game.viewer_role === 'white' ? game.black_username : game.white_username
      const result = outcome(game)
      return <Link to={`/games/${game.id}`} key={game.id}>
        <span className="history-index">{String(index + 1).padStart(2, '0')}</span>
        <span className={`history-result ${result.toLowerCase()}`}>{result}</span>
        <div><b>You <em>vs</em> {opponent}</b><small>{new Date(game.created_at).toLocaleDateString()} · {game.time_control_ms / 60000} min · {game.move_count} moves</small></div>
        <strong>{game.status === 'active' ? 'Continue →' : 'Review →'}</strong>
      </Link>
    })}{games.length === 0 && <div className="history-empty"><span>♟</span><h2>Your scorebook is empty.</h2><p>Play your first match and every move will appear here.</p><Link className="button button-primary" to="/play">Start a game</Link></div>}</div>
  </section>
}
