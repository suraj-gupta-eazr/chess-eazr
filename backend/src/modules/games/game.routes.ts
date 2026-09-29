import { Router } from 'express'
import { asyncRoute } from '../../shared/http.js'
import * as controller from './game.controller.js'

export const gameRoutes = Router()
gameRoutes.get('/:id', asyncRoute(controller.show))
gameRoutes.post('/:id/move', asyncRoute(controller.move))
gameRoutes.post('/:id/resign', asyncRoute(controller.resign))
gameRoutes.post('/:id/timeout', asyncRoute(controller.timeout))
