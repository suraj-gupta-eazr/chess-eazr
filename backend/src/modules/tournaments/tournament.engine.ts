export type Pairing = { round: number; position: number; player1Id: string; player2Id: string }

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function knockoutPairings(playerIds: string[], random = Math.random): Pairing[] {
  if (![4, 8, 16].includes(playerIds.length)) throw new Error('Short tournaments require 4, 8, or 16 players')
  const seeded = shuffle(playerIds, random)
  return Array.from({ length: seeded.length / 2 }, (_, position) => ({
    round: 1, position, player1Id: seeded[position * 2], player2Id: seeded[position * 2 + 1],
  }))
}

export function leaguePairings(playerIds: string[], random = Math.random): Pairing[] {
  if (playerIds.length < 4 || playerIds.length > 16) throw new Error('Full IPL tournaments require 4 to 16 players')
  const players: Array<string | null> = shuffle(playerIds, random)
  if (players.length % 2) players.push(null)
  const rounds: Pairing[] = []
  for (let round = 1; round < players.length; round++) {
    let position = 0
    for (let i = 0; i < players.length / 2; i++) {
      const a = players[i]
      const b = players[players.length - 1 - i]
      if (a && b) rounds.push({ round, position: position++, player1Id: a, player2Id: b })
    }
    players.splice(1, 0, players.pop()!)
  }
  return rounds
}
