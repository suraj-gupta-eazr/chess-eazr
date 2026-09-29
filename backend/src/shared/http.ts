import type { NextFunction, Request, RequestHandler, Response } from 'express'

export class AppError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}

export const asyncRoute = (
  handler: (request: Request, response: Response) => Promise<unknown>,
): RequestHandler => (request, response, next) => {
  Promise.resolve(handler(request, response)).catch(next)
}

export type AuthUser = { id: string; email?: string }
export type AuthenticatedRequest = Request & { user: AuthUser }

export function currentUser(request: Request) {
  return (request as AuthenticatedRequest).user
}

export function pathParam(request: Request, name: string) {
  const value = request.params[name]
  if (!value || Array.isArray(value)) throw new AppError(`Invalid ${name}`)
  return value
}

export type ErrorMiddleware = (error: unknown, request: Request, response: Response, next: NextFunction) => unknown
