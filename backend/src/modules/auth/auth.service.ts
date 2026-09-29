import { supabaseAdmin, supabaseAuth } from '../../config/supabase.js'
import { AppError } from '../../shared/http.js'
import { createAvailableUsername } from '../profiles/profile.service.js'
import type { z } from 'zod'
import type { loginSchema, registerSchema } from './auth.schema.js'

export async function register(input: z.infer<typeof registerSchema>) {
  const username = await createAvailableUsername(input.name)
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name, age: input.age, gender: input.gender, username },
  })
  if (createError || !created.user) throw new AppError(createError?.message ?? 'Could not create account', createError?.status === 422 ? 409 : 400)

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email: input.email, password: input.password })
  if (error) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id)
    throw new AppError('Could not sign in to the new account', 500)
  }
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
