import { randomInt } from 'node:crypto'

export function usernameBase(name: string) {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .split(/\s+/)[0].replace(/[^a-z0-9_]/g, '').slice(0, 14) || 'player'
}

export function preferredUsername(name: string) {
  const base = usernameBase(name)
  return base.length >= 3 ? base : `${base}1`
}

export function usernameCandidate(name: string, digits: number) {
  return `${usernameBase(name)}${String(randomInt(10 ** digits)).padStart(digits, '0')}`
}
