import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  age: z.coerce.number().int().min(13).max(120),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']),
  email: z.email(),
  password: z.string().min(8).max(128),
})
export const loginSchema = z.object({ email: z.email(), password: z.string().min(1) })
export const refreshSchema = z.object({ refreshToken: z.string().min(1) })
