import { Chess } from 'chess.js'

export function restoreGame(fen: string, pgn: string) {
  const chess = new Chess()
  if (pgn) chess.loadPgn(pgn)
  else chess.load(fen)
  return chess
}
