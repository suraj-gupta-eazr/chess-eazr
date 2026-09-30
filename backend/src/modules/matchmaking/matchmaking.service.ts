import { db } from '../../config/database.js'
import type { z } from 'zod'
import type { joinQueueSchema } from './matchmaking.schema.js'

export async function joinQueue(userId: string, input: z.infer<typeof joinQueueSchema>) {
  const timeControlMs = input.minutes * 60_000
  return db.begin(async (transaction) => {
    const [existingGame] = await transaction`select * from games where status = 'active' and (${userId} in (white_id, black_id)) order by created_at desc limit 1`
    if (existingGame) return { status: 'matched', game: existingGame }
    if (input.mode === 'bot') {
      await transaction`delete from matchmaking_queue where user_id = ${userId}`
      const [game] = await transaction`
        insert into games (white_id, black_id, bot_side, time_control_ms, white_ms, black_ms, status, started_at, last_move_at)
        values (${userId}, ${userId}, 'black', ${timeControlMs}, ${timeControlMs}, ${timeControlMs}, 'active', now(), now()) returning *
      `
      return { status: 'matched', game }
    }
    const [opponent] = await transaction`
      select q.user_id from matchmaking_queue q
      where q.user_id != ${userId} and q.time_control_ms = ${timeControlMs}
      order by q.joined_at limit 1 for update skip locked
    `
    if (!opponent) {
      await transaction`
        insert into matchmaking_queue (user_id, time_control_ms) values (${userId}, ${timeControlMs})
        on conflict (user_id) do update set time_control_ms = excluded.time_control_ms, joined_at = now()
      `
      return { status: 'waiting' }
    }
    await transaction`delete from matchmaking_queue where user_id in (${userId}, ${opponent.user_id})`
    const white = Math.random() < 0.5 ? userId : opponent.user_id
    const black = white === userId ? opponent.user_id : userId
    const [game] = await transaction`
      insert into games (white_id, black_id, time_control_ms, white_ms, black_ms, status, started_at, last_move_at)
      values (${white}, ${black}, ${timeControlMs}, ${timeControlMs}, ${timeControlMs}, 'active', now(), now()) returning *
    `
    return { status: 'matched', game }
  })
}

export async function leaveQueue(userId: string) {
  await db`delete from matchmaking_queue where user_id = ${userId}`
}
