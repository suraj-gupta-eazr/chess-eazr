import type { Request, Response } from 'express'
import { currentUser } from '../../shared/http.js'
import { updateProfileSchema } from './profile.schema.js'
import { getProfile, updateUsername } from './profile.service.js'

export async function showProfile(request: Request, response: Response) {
  const user = currentUser(request)
  response.json(await getProfile(user.id, user.email))
}

export async function editProfile(request: Request, response: Response) {
  const { username } = updateProfileSchema.parse(request.body)
  response.json(await updateUsername(currentUser(request).id, username))
}
