import type { Request, Response } from 'express'
import { currentUser, pathParam } from '../../shared/http.js'
import { createClubSchema, joinClubSchema, joinPrivateClubSchema } from './club.schema.js'
import * as service from './club.service.js'

export async function index(request: Request, response: Response) { response.json(await service.listClubs(currentUser(request).id)) }
export async function create(request: Request, response: Response) { response.status(201).json(await service.createClub(currentUser(request).id, createClubSchema.parse(request.body))) }
export async function show(request: Request, response: Response) { response.json(await service.getClub(currentUser(request).id, pathParam(request, 'id'))) }
export async function join(request: Request, response: Response) {
  const { inviteCode } = joinClubSchema.parse(request.body)
  await service.joinClub(currentUser(request).id, pathParam(request, 'id'), inviteCode)
  response.status(204).end()
}
export async function joinPrivate(request: Request, response: Response) {
  const { inviteCode } = joinPrivateClubSchema.parse(request.body)
  response.json(await service.joinPrivateClub(currentUser(request).id, inviteCode))
}
export async function regenerateInvite(request: Request, response: Response) { response.json(await service.regenerateInviteCode(currentUser(request).id, pathParam(request, 'id'))) }
