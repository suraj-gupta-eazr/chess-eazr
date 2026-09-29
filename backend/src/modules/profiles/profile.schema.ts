import { z } from 'zod'

export const updateProfileSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_]{2,19}$/, 'Use 3–20 lowercase letters, numbers, or underscores'),
})
