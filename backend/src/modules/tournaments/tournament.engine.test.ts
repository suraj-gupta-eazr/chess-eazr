import assert from 'node:assert/strict'
import test from 'node:test'
import { knockoutPairings, leaguePairings } from './tournament.engine.js'

test('short tournament creates four unique first-round matches for eight players', () => {
  const players = Array.from({ length: 8 }, (_, i) => `p${i}`)
  const matches = knockoutPairings(players, () => 0.5)
  assert.equal(matches.length, 4)
  assert.deepEqual(new Set(matches.flatMap((match) => [match.player1Id, match.player2Id])), new Set(players))
})

test('full IPL tournament pairs every player once', () => {
  const players = ['a', 'b', 'c', 'd', 'e']
  const matches = leaguePairings(players, () => 0.5)
  assert.equal(matches.length, 10)
  assert.equal(new Set(matches.map((match) => [match.player1Id, match.player2Id].sort().join(':'))).size, 10)
})
