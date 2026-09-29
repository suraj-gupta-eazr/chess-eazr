import { Router } from 'express'
import { asyncRoute } from '../../shared/http.js'
import * as controller from './matchmaking.controller.js'

export const matchmakingRoutes = Router()
matchmakingRoutes.post('/join', asyncRoute(controller.join))
matchmakingRoutes.delete('/leave', asyncRoute(controller.leave))
