import type { Request, Response } from 'express'
import { currentUser, pathParam } from '../../shared/http.js'
import { createTournamentSchema } from './tournament.schema.js'
import * as service from './tournament.service.js'

export async function create(request: Request, response: Response) { response.status(201).json(await service.createTournament(currentUser(request).id, pathParam(request, 'clubId'), createTournamentSchema.parse(request.body))) }
export async function start(request: Request, response: Response) { response.json(await service.startTournament(currentUser(request).id, pathParam(request, 'id'))) }
export async function show(request: Request, response: Response) { response.json(await service.getTournament(currentUser(request).id, pathParam(request, 'id'))) }
export async function ready(request: Request, response: Response) {
  const game = await service.readyForMatch(currentUser(request).id, pathParam(request, 'id'))
  response.json({ game, waiting: !game })
}
