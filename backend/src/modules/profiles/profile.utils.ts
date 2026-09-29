import { randomInt } from 'node:crypto'

export function usernameBase(name: string) {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .split(/\s+/)[0].replace(/[^a-z0-9_]/g, '').slice(0, 14) || 'player'
}

export function usernameCandidate(name: string, digits: number) {
  return `${usernameBase(name)}${String(randomInt(10 ** digits)).padStart(digits, '0')}`
}
