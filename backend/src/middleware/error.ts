import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../shared/http.js'

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof ZodError) return response.status(400).json({ error: error.issues[0]?.message ?? 'Invalid input' })
  if (error instanceof AppError) return response.status(error.status).json({ error: error.message })
  const databaseError = error as { code?: string }
  if (databaseError.code === '23505') return response.status(409).json({ error: 'That value is already in use' })
  console.error(error)
  return response.status(500).json({ error: 'Something went wrong' })
}
