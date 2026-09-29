import type { Request, Response } from 'express'
import { forgotPasswordSchema, loginSchema, refreshSchema, registerSchema } from './auth.schema.js'
import * as authService from './auth.service.js'

export async function register(request: Request, response: Response) {
  response.status(201).json(await authService.register(registerSchema.parse(request.body)))
}
export async function login(request: Request, response: Response) {
  response.json(await authService.login(loginSchema.parse(request.body)))
}
export async function refresh(request: Request, response: Response) {
  const { refreshToken } = refreshSchema.parse(request.body)
  response.json(await authService.refresh(refreshToken))
}
export async function forgotPassword(request: Request, response: Response) {
  await authService.forgotPassword(forgotPasswordSchema.parse(request.body))
  response.status(202).json({ message: 'If the details match, a password reset link is on its way.' })
}
