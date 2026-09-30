import { z } from 'zod'

export const joinQueueSchema = z.object({
  mode: z.enum(['random', 'bot']),
  minutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(30)]),
})
