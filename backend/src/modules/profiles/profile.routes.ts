import { Router } from 'express'
import { asyncRoute } from '../../shared/http.js'
import { editProfile, showProfile } from './profile.controller.js'

export const profileRoutes = Router()
profileRoutes.get('/', asyncRoute(showProfile))
profileRoutes.patch('/', asyncRoute(editProfile))
