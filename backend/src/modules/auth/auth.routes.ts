import { Router } from 'express'
import { asyncRoute } from '../../shared/http.js'
import * as controller from './auth.controller.js'

export const authRoutes = Router()
authRoutes.post('/register', asyncRoute(controller.register))
authRoutes.post('/login', asyncRoute(controller.login))
authRoutes.post('/refresh', asyncRoute(controller.refresh))
authRoutes.post('/forgot-password', asyncRoute(controller.forgotPassword))
