import { randomBytes } from 'node:crypto'
import { db } from '../../config/database.js'
import { preferredUsername, usernameCandidate } from './profile.utils.js'

export async function createAvailableUsername(name: string) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const username = attempt === 0 ? preferredUsername(name) : usernameCandidate(name, attempt < 10 ? 2 : attempt < 20 ? 3 : 4)
    const [taken] = await db`select 1 from profiles where username = ${username}`
    if (!taken) return username
  }
  return `player${randomBytes(4).toString('hex')}`
}

export async function getProfile(userId: string, email?: string) {
  const [profile] = await db`select id, name, username, age, gender, created_at from profiles where id = ${userId}`
  return { ...profile, email }
}

export async function updateUsername(userId: string, username: string) {
  const [profile] = await db`
    update profiles set username = ${username}, updated_at = now()
    where id = ${userId} returning id, name, username, age, gender
  `
  return profile
}
