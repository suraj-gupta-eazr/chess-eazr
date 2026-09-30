import { Chess } from 'chess.js'

export function restoreGame(fen: string, pgn: string) {
  const chess = new Chess()
  if (pgn) chess.loadPgn(pgn)
  else chess.load(fen)
  return chess
}

const pieceValue: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }

export function chooseBotMove(chess: Chess) {
  const choices = chess.moves({ verbose: true }).map((move) => {
    chess.move(move)
    const score = (move.captured ? pieceValue[move.captured] : 0) + (move.promotion ? pieceValue[move.promotion] : 0)
      + (chess.isCheckmate() ? 100_000 : chess.isCheck() ? 50 : 0)
    chess.undo()
    return { move, score }
  })
  const best = Math.max(...choices.map((choice) => choice.score))
  const finalists = choices.filter((choice) => choice.score === best)
  const selected = finalists[Math.floor(Math.random() * finalists.length)]?.move
  return selected ? { from: selected.from, to: selected.to, promotion: selected.promotion ?? 'q' } : null
}
