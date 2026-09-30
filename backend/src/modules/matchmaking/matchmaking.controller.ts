import type { Request, Response } from 'express'
import { currentUser } from '../../shared/http.js'
import { joinQueue, leaveQueue } from './matchmaking.service.js'
import { joinQueueSchema } from './matchmaking.schema.js'

export async function join(request: Request, response: Response) { response.json(await joinQueue(currentUser(request).id, joinQueueSchema.parse(request.body))) }
export async function leave(request: Request, response: Response) { await leaveQueue(currentUser(request).id); response.status(204).end() }
