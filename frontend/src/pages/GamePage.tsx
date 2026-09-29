import { useEffect, useMemo, useState } from 'react'
import { Chess, type Square } from 'chess.js'
import { useParams } from 'react-router-dom'
import { Loading } from '../components/ui'
import { api } from '../services/api'
import { authorizeRealtime, realtime } from '../services/realtime'
import type { Game } from '../types/domain'

const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const pieceGlyph: Record<string, string> = { wp: '♙', wn: '♘', wb: '♗', wr: '♖', wq: '♕', wk: '♔', bp: '♟', bn: '♞', bb: '♝', br: '♜', bq: '♛', bk: '♚' }

function PlayerClock({ name, time, active, color }: { name: string; time: number; active: boolean; color: 'white' | 'black' }) {
  const minutes = Math.floor(time / 60000); const seconds = Math.floor((time % 60000) / 1000)
  return <div className={`player-clock ${active ? 'active' : ''}`}><span className={`piece-dot ${color}`}>{color === 'white' ? '♙' : '♟'}</span><div><b>{name}</b><small>{active ? 'clock running' : 'waiting'}</small></div><time>{minutes}:{String(seconds).padStart(2, '0')}</time></div>
}

export function GamePage() {
  const { id } = useParams()
  const [game, setGame] = useState<Game | null>(null)
  const [selected, setSelected] = useState<Square | null>(null)
  const [reviewPly, setReviewPly] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const load = () => api<Game>(`/games/${id}`).then(setGame).catch((cause) => setError(cause.message))

  useEffect(() => {
    void load()
    const timer = setInterval(() => setNow(Date.now()), 250)
    const client = realtime
    if (client && id) void authorizeRealtime().then(() => client.channel(`game-${id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${id}` }, load).subscribe())
    return () => { clearInterval(timer); if (client) void client.removeAllChannels() }
  }, [id])

  const livePosition = useMemo(() => game ? new Chess(game.fen) : null, [game?.fen])
  const displayFen = game ? reviewPly === null ? game.fen : reviewPly === 0 ? initialFen : game.moves[reviewPly - 1]?.fen_after ?? game.fen : initialFen
  const displayPosition = useMemo(() => new Chess(displayFen), [displayFen])
  const elapsed = game?.status === 'active' ? now - new Date(game.last_move_at).getTime() : 0
  const whiteTime = game && livePosition ? Math.max(0, game.white_ms - (livePosition.turn() === 'w' ? elapsed : 0)) : 0
  const blackTime = game && livePosition ? Math.max(0, game.black_ms - (livePosition.turn() === 'b' ? elapsed : 0)) : 0

  useEffect(() => {
    if (game?.viewer_role !== 'spectator' && game?.status === 'active' && (whiteTime === 0 || blackTime === 0)) void api(`/games/${game.id}/timeout`, { method: 'POST' }).then(load)
  }, [game?.id, game?.status, game?.viewer_role, whiteTime === 0, blackTime === 0])

  if (!game || !livePosition) return <Loading message={error || 'Setting the pieces…'} />
  const currentGame = game
  const currentPosition = livePosition
  const isPlayer = currentGame.viewer_role !== 'spectator'
  const isWhite = currentGame.viewer_role !== 'black'
  const canPlay = isPlayer && currentGame.status === 'active' && reviewPly === null
  const files = isWhite ? ['a','b','c','d','e','f','g','h'] : ['h','g','f','e','d','c','b','a']
  const ranks = isWhite ? [8,7,6,5,4,3,2,1] : [1,2,3,4,5,6,7,8]
  const legal = canPlay && selected ? currentPosition.moves({ square: selected, verbose: true }).map((move) => move.to) : []
  const opponent = currentGame.viewer_role === 'white' ? currentGame.black_username : currentGame.white_username
  const resultText = currentGame.result === '1/2-1/2' ? 'Draw' : currentGame.result === '1-0' ? `${currentGame.white_username} won` : currentGame.result === '0-1' ? `${currentGame.black_username} won` : 'In progress'

  async function squareClick(square: Square) {
    if (!canPlay) return
    if (!selected) { const piece = currentPosition.get(square); if (piece?.color === (isWhite ? 'w' : 'b') && currentPosition.turn() === piece.color) setSelected(square); return }
    if (square === selected) { setSelected(null); return }
    if (!legal.includes(square)) { const piece = currentPosition.get(square); setSelected(piece?.color === (isWhite ? 'w' : 'b') ? square : null); return }
    try {
      await api(`/games/${currentGame.id}/move`, { method: 'POST', body: JSON.stringify({ from: selected, to: square, promotion: 'q', version: currentGame.version }) })
      setSelected(null); setError(''); await load()
    } catch (cause) { setError((cause as Error).message); setSelected(null); void load() }
  }
  async function resign() { if (confirm('Resign this game?')) { await api(`/games/${currentGame.id}/resign`, { method: 'POST' }); await load() } }

  const visiblePly = reviewPly ?? currentGame.moves.length
  const moveRows = Array.from({ length: Math.ceil(currentGame.moves.length / 2) }, (_, index) => currentGame.moves.slice(index * 2, index * 2 + 2))
  return <section className="game-room">
    <header><div><p className="eyebrow dark">{currentGame.status === 'finished' ? 'GAME REVIEW' : isPlayer ? 'LIVE MATCH' : 'WATCHING LIVE'}</p><h1>{isPlayer ? <>You <em>vs</em> {opponent}</> : <>{currentGame.white_username} <em>vs</em> {currentGame.black_username}</>}</h1></div>{isPlayer && <button className="text-button danger" onClick={resign} disabled={currentGame.status !== 'active'}>Resign</button>}</header>
    {currentGame.viewer_role === 'spectator' && <p className="spectator-note">Spectator view · You can watch the position and replay every move, but only the assigned players can move.</p>}
    {error && <p className="form-error">{error}</p>}
    <div className="game-layout"><div className="board-column"><div className="board-wrap"><div className="chessboard" role="grid" aria-label={reviewPly === null ? 'Current chess position' : `Chess position after move ${reviewPly}`}>{ranks.flatMap((rank) => files.map((file) => {
        const square = `${file}${rank}` as Square; const piece = displayPosition.get(square); const dark = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 1
        return <button role="gridcell" aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`} key={square} onClick={() => squareClick(square)} className={`${dark ? 'dark-square' : 'light-square'} ${selected === square && canPlay ? 'selected' : ''} ${legal.includes(square) ? 'legal' : ''}`}><span>{piece ? pieceGlyph[`${piece.color}${piece.type}`] : ''}</span>{file === files[0] && <small className="rank-label">{rank}</small>}{rank === ranks[ranks.length - 1] && <small className="file-label">{file}</small>}</button>
      }))}</div></div>
      <div className="replay-controls" aria-label="Replay controls"><button onClick={() => setReviewPly(0)} disabled={!currentGame.moves.length}>|← Start</button><button onClick={() => setReviewPly(Math.max(0, visiblePly - 1))} disabled={visiblePly === 0}>← Previous</button><span>{reviewPly === null ? 'Latest position' : `Move ${reviewPly} of ${currentGame.moves.length}`}</span><button onClick={() => setReviewPly(visiblePly + 1 >= currentGame.moves.length ? null : visiblePly + 1)} disabled={visiblePly >= currentGame.moves.length}>Next →</button><button onClick={() => setReviewPly(null)} disabled={reviewPly === null}>End →|</button></div>
      </div>
      <aside className="score-panel"><PlayerClock name={currentGame.black_username} time={blackTime} active={currentGame.status === 'active' && livePosition.turn() === 'b'} color="black" />
        <div className={`turn-card ${currentGame.status}`}><small>{currentGame.status === 'finished' ? 'RESULT' : reviewPly !== null ? 'REPLAY' : 'TURN'}</small><strong>{currentGame.status === 'finished' ? resultText : reviewPly !== null ? `Position after ply ${reviewPly}` : currentGame.viewer_role === 'spectator' ? `${livePosition.turn() === 'w' ? currentGame.white_username : currentGame.black_username} to move` : livePosition.turn() === (isWhite ? 'w' : 'b') ? 'Your move' : `${opponent} is thinking`}</strong></div>
        <div className="move-sheet"><div><h2>Moves</h2><small>{currentGame.moves.length} plies</small></div><ol>{moveRows.map((row, index) => <li key={index}><span>{index + 1}.</span>{row.map((move) => <button className={visiblePly === move.ply ? 'current' : ''} onClick={() => setReviewPly(move.ply === currentGame.moves.length ? null : move.ply)} key={move.ply}>{move.san}</button>)}</li>)}{moveRows.length === 0 && <p>No moves played yet.</p>}</ol></div>
        <PlayerClock name={currentGame.white_username} time={whiteTime} active={currentGame.status === 'active' && livePosition.turn() === 'w'} color="white" />
      </aside>
    </div>
  </section>
}
