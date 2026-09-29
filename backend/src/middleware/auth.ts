import type { NextFunction, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import { AppError, type AuthenticatedRequest } from '../shared/http.js'

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  try {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
    if (!token) throw new AppError('Sign in required', 401)
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data.user) throw new AppError('Session expired', 401)
    ;(request as AuthenticatedRequest).user = { id: data.user.id, email: data.user.email }
    next()
  } catch (error) { next(error) }
}
