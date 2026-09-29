import { z } from 'zod'

export const createClubSchema = z.object({
  name: z.string().trim().min(3).max(60),
  visibility: z.enum(['public', 'private']),
})
export const joinClubSchema = z.object({ inviteCode: z.string().optional() })
export const joinPrivateClubSchema = z.object({ inviteCode: z.string().trim().length(8) })
