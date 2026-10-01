import { useEffect, useMemo, useState } from 'react'
import { Chess, type Square } from 'chess.js'
import { useParams } from 'react-router-dom'
import { ChessPiece } from '../components/ChessPiece'
import { Loading } from '../components/ui'
import { api } from '../services/api'
import { authorizeRealtime, realtime } from '../services/realtime'
import type { Game } from '../types/domain'

const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

function movesForPiece(position: Chess, square: Square) {
  const piece = position.get(square)
  if (!piece) return []
  const fen = position.fen().split(' ')
  if (fen[1] !== piece.color) fen[3] = '-'
  fen[1] = piece.color
  try { return new Chess(fen.join(' ')).moves({ square, verbose: true }) } catch { return [] }
}

function PlayerClock({ name, time, active, color, you = false }: { name: string; time: number; active: boolean; color: 'white' | 'black'; you?: boolean }) {
  const minutes = Math.floor(time / 60000); const seconds = Math.floor((time % 60000) / 1000)
  return <div className={`player-clock ${active ? 'active' : ''}`}><span className={`piece-dot ${color}`}>♟</span><div><b>{name}{you ? ' (You)' : ''}</b><small>{active ? 'clock running' : 'waiting'}</small></div><time>{minutes}:{String(seconds).padStart(2, '0')}</time></div>
}

export function GamePage() {
  const { id } = useParams()
  const [game, setGame] = useState<Game | null>(null)
  const [selected, setSelected] = useState<Square | null>(null)
  const [reviewPly, setReviewPly] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [moving, setMoving] = useState(false)
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
  const playerColor = isWhite ? 'w' : 'b'
  const isMyTurn = isPlayer && currentPosition.turn() === playerColor
  const canInspect = isPlayer && currentGame.status === 'active' && reviewPly === null && !moving
  const files = isWhite ? ['a','b','c','d','e','f','g','h'] : ['h','g','f','e','d','c','b','a']
  const ranks = isWhite ? [8,7,6,5,4,3,2,1] : [1,2,3,4,5,6,7,8]
  const previewMoves = canInspect && selected ? movesForPiece(currentPosition, selected) : []
  const legal = new Set(previewMoves.map((move) => move.to))
  const captures = new Set(previewMoves.filter((move) => move.captured).map((move) => move.to))
  const canMoveSelected = Boolean(isMyTurn && selected && currentPosition.get(selected)?.color === playerColor)
  const opponent = currentGame.viewer_role === 'white' ? currentGame.black_username : currentGame.white_username
  const lastFrom = currentGame.last_move?.slice(0, 2)
  const lastTo = currentGame.last_move?.slice(2, 4)
  const resultText = currentGame.result === '1/2-1/2' ? 'Draw' : currentGame.result === '1-0' ? `${currentGame.white_username} won` : currentGame.result === '0-1' ? `${currentGame.black_username} won` : 'In progress'

  async function squareClick(square: Square) {
    if (!canInspect) return
    if (!selected) { if (currentPosition.get(square)) setSelected(square); return }
    if (square === selected) { setSelected(null); return }
    if (!canMoveSelected || !legal.has(square)) { setSelected(currentPosition.get(square) ? square : null); return }
    try {
      setMoving(true)
      const optimisticPosition = new Chess(currentGame.fen)
      const optimisticMove = optimisticPosition.move({ from: selected, to: square, promotion: 'q' })
      const playedAt = new Date().toISOString()
      setGame({ ...currentGame, fen: optimisticPosition.fen(), pgn: optimisticPosition.pgn(), last_move: `${selected}${square}${optimisticMove.promotion ?? ''}`, last_move_at: playedAt, version: currentGame.version + 1, white_ms: currentPosition.turn() === 'w' ? whiteTime : currentGame.white_ms, black_ms: currentPosition.turn() === 'b' ? blackTime : currentGame.black_ms, moves: [...currentGame.moves, { ply: currentGame.version + 1, san: optimisticMove.san, from_square: optimisticMove.from, to_square: optimisticMove.to, fen_after: optimisticPosition.fen(), white_ms: currentPosition.turn() === 'w' ? whiteTime : currentGame.white_ms, black_ms: currentPosition.turn() === 'b' ? blackTime : currentGame.black_ms, played_at: playedAt }] })
      setSelected(null); setError('')
      const updated = await api<Game>(`/games/${currentGame.id}/move`, { method: 'POST', body: JSON.stringify({ from: selected, to: square, promotion: 'q', version: currentGame.version }) })
      if (updated.bot_side) setTimeout(() => { setGame(updated); setMoving(false) }, 420)
      else { setGame(updated); setMoving(false) }
    } catch (cause) { setError((cause as Error).message); setSelected(null); setMoving(false); setGame(currentGame); void load() }
  }
  async function resign() { if (confirm('Resign this game?')) { await api(`/games/${currentGame.id}/resign`, { method: 'POST' }); await load() } }

  const visiblePly = reviewPly ?? currentGame.moves.length
  const moveRows = Array.from({ length: Math.ceil(currentGame.moves.length / 2) }, (_, index) => currentGame.moves.slice(index * 2, index * 2 + 2))
  return <section className="game-room">
    <header><div><p className="eyebrow dark">{currentGame.status === 'finished' ? 'GAME REVIEW' : isPlayer ? 'LIVE MATCH' : 'WATCHING LIVE'}</p><h1>{isPlayer ? <>You <em>vs</em> {opponent}</> : <>{currentGame.white_username} <em>vs</em> {currentGame.black_username}</>}</h1></div>{isPlayer && <button className="text-button danger" onClick={resign} disabled={currentGame.status !== 'active'}>Resign</button>}</header>
    {currentGame.viewer_role === 'spectator' && <p className="spectator-note">Spectator view · You can watch the position and replay every move, but only the assigned players can move.</p>}
    {error && <p className="form-error">{error}</p>}
    <div className="game-layout"><div className="board-column">
      <PlayerClock name={isWhite ? currentGame.black_username : currentGame.white_username} time={isWhite ? blackTime : whiteTime} active={currentGame.status === 'active' && currentPosition.turn() === (isWhite ? 'b' : 'w')} color={isWhite ? 'black' : 'white'} />
      <div className={`board-wrap ${moving ? 'moving' : ''} ${selected && !canMoveSelected ? 'planning' : ''}`}><div className="chessboard" role="grid" aria-label={reviewPly === null ? 'Current chess position' : `Chess position after move ${reviewPly}`}>{ranks.flatMap((rank) => files.map((file) => {
        const square = `${file}${rank}` as Square; const piece = displayPosition.get(square); const dark = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 1
        return <button role="gridcell" aria-selected={selected === square} aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`} key={square} onClick={() => squareClick(square)} className={`${dark ? 'dark-square' : 'light-square'} ${selected === square ? 'selected' : ''} ${legal.has(square) ? 'legal' : ''} ${captures.has(square) ? 'capture' : ''} ${legal.has(square) && !canMoveSelected ? 'planning-target' : ''} ${reviewPly === null && (square === lastFrom || square === lastTo) ? 'last-move' : ''}`}>{piece ? <ChessPiece type={piece.type} color={piece.color} /> : null}{file === files[0] && <small className="rank-label">{rank}</small>}{rank === ranks[ranks.length - 1] && <small className="file-label">{file}</small>}</button>
      }))}</div></div>
      <PlayerClock name={isWhite ? currentGame.white_username : currentGame.black_username} time={isWhite ? whiteTime : blackTime} active={currentGame.status === 'active' && currentPosition.turn() === (isWhite ? 'w' : 'b')} color={isWhite ? 'white' : 'black'} you={isPlayer} />
      <div className="board-meta"><span>{isWhite ? 'WHITE' : 'BLACK'} SIDE</span><b>{currentGame.time_control_ms / 60000} MIN · {currentGame.bot_side ? 'BOT GAME' : 'LIVE GAME'}</b></div>
      <div className="replay-controls" aria-label="Replay controls"><button onClick={() => setReviewPly(0)} disabled={!currentGame.moves.length}>|← Start</button><button onClick={() => setReviewPly(Math.max(0, visiblePly - 1))} disabled={visiblePly === 0}>← Previous</button><span>{reviewPly === null ? 'Latest position' : `Move ${reviewPly} of ${currentGame.moves.length}`}</span><button onClick={() => setReviewPly(visiblePly + 1 >= currentGame.moves.length ? null : visiblePly + 1)} disabled={visiblePly >= currentGame.moves.length}>Next →</button><button onClick={() => setReviewPly(null)} disabled={reviewPly === null}>End →|</button></div>
      </div>
      <aside className="score-panel">
        <div className={`turn-card ${currentGame.status}`}><small>{currentGame.status === 'finished' ? 'RESULT' : reviewPly !== null ? 'REPLAY' : isMyTurn ? 'YOUR TURN' : 'PLANNING MODE'}</small><strong>{currentGame.status === 'finished' ? resultText : reviewPly !== null ? `Position after ply ${reviewPly}` : currentGame.viewer_role === 'spectator' ? `${livePosition.turn() === 'w' ? currentGame.white_username : currentGame.black_username} to move` : isMyTurn ? 'Make your move' : `${opponent} is thinking`}</strong>{isPlayer && currentGame.status === 'active' && reviewPly === null && <p>{isMyTurn ? 'Select your piece, then choose a highlighted square.' : 'Select any piece to study its moves. Moving unlocks after your opponent plays.'}</p>}</div>
        <div className="move-sheet"><div><h2>Moves</h2><small>{currentGame.moves.length} plies</small></div><ol>{moveRows.map((row, index) => <li key={index}><span>{index + 1}.</span>{row.map((move) => <button className={visiblePly === move.ply ? 'current' : ''} onClick={() => setReviewPly(move.ply === currentGame.moves.length ? null : move.ply)} key={move.ply}>{move.san}</button>)}</li>)}{moveRows.length === 0 && <p>No moves played yet.</p>}</ol></div>
      </aside>
    </div>
  </section>
}
