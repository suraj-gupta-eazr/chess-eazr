import { supabaseAuth } from '../../config/supabase.js'
import { AppError } from '../../shared/http.js'
import { createAvailableUsername } from '../profiles/profile.service.js'
import type { z } from 'zod'
import type { loginSchema, registerSchema } from './auth.schema.js'

export async function register(input: z.infer<typeof registerSchema>) {
  const username = await createAvailableUsername(input.name)
  const { data, error } = await supabaseAuth.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { name: input.name, age: input.age, gender: input.gender, username } },
  })
  if (error) throw new AppError(error.message)
  if (!data.session) throw new AppError('Disable email confirmation in Supabase to allow immediate sign-in', 503)
  return { session: data.session, username }
}

export async function login(input: z.infer<typeof loginSchema>) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword(input)
  if (error) throw new AppError('Email or password is incorrect', 401)
  return { session: data.session }
}

export async function refresh(refreshToken: string) {
  const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token: refreshToken })
  if (error) throw new AppError('Session expired', 401)
  return { session: data.session }
}
