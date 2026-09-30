import type { Request, Response } from 'express'
import { currentUser, pathParam } from '../../shared/http.js'
import { moveSchema } from './game.schema.js'
import * as service from './game.service.js'

export async function show(request: Request, response: Response) { response.json(await service.getGame(currentUser(request).id, pathParam(request, 'id'))) }
export async function move(request: Request, response: Response) {
  const userId = currentUser(request).id
  const gameId = pathParam(request, 'id')
  await service.submitMove(userId, gameId, moveSchema.parse(request.body))
  response.json(await service.getGame(userId, gameId))
}
export async function resign(request: Request, response: Response) { response.json(await service.resignGame(currentUser(request).id, pathParam(request, 'id'))) }
export async function timeout(request: Request, response: Response) { response.json(await service.claimTimeout(currentUser(request).id, pathParam(request, 'id'))) }
