import { Router } from 'express'
import { asyncRoute } from '../../shared/http.js'
import * as controller from './club.controller.js'

export const clubRoutes = Router()
clubRoutes.get('/', asyncRoute(controller.index))
clubRoutes.post('/', asyncRoute(controller.create))
clubRoutes.post('/join-private', asyncRoute(controller.joinPrivate))
clubRoutes.get('/:id', asyncRoute(controller.show))
clubRoutes.post('/:id/join', asyncRoute(controller.join))
clubRoutes.post('/:id/invite-code', asyncRoute(controller.regenerateInvite))
