type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'

export function ChessPiece({ type, color }: { type: PieceType; color: 'w' | 'b' }) {
  return <img className="board-piece" src={`/pieces/kaneo/${color}${type.toUpperCase()}.svg`} alt="" draggable={false} />
}
