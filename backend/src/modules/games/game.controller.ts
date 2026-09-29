import type { Request, Response } from 'express'
import { currentUser, pathParam } from '../../shared/http.js'
import { moveSchema } from './game.schema.js'
import * as service from './game.service.js'

export async function show(request: Request, response: Response) { response.json(await service.getGame(currentUser(request).id, pathParam(request, 'id'))) }
export async function move(request: Request, response: Response) { response.json(await service.submitMove(currentUser(request).id, pathParam(request, 'id'), moveSchema.parse(request.body))) }
export async function resign(request: Request, response: Response) { response.json(await service.resignGame(currentUser(request).id, pathParam(request, 'id'))) }
export async function timeout(request: Request, response: Response) { response.json(await service.claimTimeout(currentUser(request).id, pathParam(request, 'id'))) }
