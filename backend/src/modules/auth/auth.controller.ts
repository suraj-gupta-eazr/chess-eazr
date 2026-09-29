import type { Request, Response } from 'express'
import { loginSchema, refreshSchema, registerSchema } from './auth.schema.js'
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
