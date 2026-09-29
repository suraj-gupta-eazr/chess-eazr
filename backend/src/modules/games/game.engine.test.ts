import assert from 'node:assert/strict'
import test from 'node:test'
import { Chess } from 'chess.js'
import { restoreGame } from './game.engine.js'

test('restores the complete move history before adding the next move', () => {
  const first = new Chess()
  first.move('e4')
  const restored = restoreGame(first.fen(), first.pgn())
  restored.move('e5')
  assert.deepEqual(restored.history(), ['e4', 'e5'])
})
