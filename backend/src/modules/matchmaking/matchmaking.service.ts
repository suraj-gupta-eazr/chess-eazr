import { db } from '../../config/database.js'

export async function joinQueue(userId: string) {
  return db.begin(async (transaction) => {
    const [existingGame] = await transaction`select * from games where status = 'active' and (${userId} in (white_id, black_id)) order by created_at desc limit 1`
    if (existingGame) return { status: 'matched', game: existingGame }
    const [opponent] = await transaction`select q.user_id from matchmaking_queue q where q.user_id != ${userId} order by random() limit 1 for update skip locked`
    if (!opponent) {
      await transaction`insert into matchmaking_queue (user_id) values (${userId}) on conflict (user_id) do update set joined_at = now()`
      return { status: 'waiting' }
    }
    await transaction`delete from matchmaking_queue where user_id in (${userId}, ${opponent.user_id})`
    const white = Math.random() < 0.5 ? userId : opponent.user_id
    const black = white === userId ? opponent.user_id : userId
    const [game] = await transaction`insert into games (white_id, black_id, status, started_at, last_move_at) values (${white}, ${black}, 'active', now(), now()) returning *`
    return { status: 'matched', game }
  })
}

export async function leaveQueue(userId: string) {
  await db`delete from matchmaking_queue where user_id = ${userId}`
}
