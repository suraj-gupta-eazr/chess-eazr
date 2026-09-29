import { z } from 'zod'

export const createTournamentSchema = z.object({
  name: z.string().trim().min(3).max(80),
  format: z.enum(['short', 'ipl']),
  playerIds: z.array(z.uuid()).min(4).max(16),
})
