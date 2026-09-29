import { Router } from 'express'
import { asyncRoute } from '../../shared/http.js'
import * as controller from './tournament.controller.js'

export const tournamentRoutes = Router()
tournamentRoutes.post('/clubs/:clubId/tournaments', asyncRoute(controller.create))
tournamentRoutes.post('/tournaments/:id/start', asyncRoute(controller.start))
tournamentRoutes.get('/tournaments/:id', asyncRoute(controller.show))
tournamentRoutes.post('/tournament-matches/:id/ready', asyncRoute(controller.ready))
