import { supabaseAdmin, supabaseAuth } from '../../config/supabase.js'
import { db } from '../../config/database.js'
import { env } from '../../config/env.js'
import { AppError } from '../../shared/http.js'
import { createAvailableUsername } from '../profiles/profile.service.js'
import type { z } from 'zod'
import type { forgotPasswordSchema, loginSchema, registerSchema } from './auth.schema.js'

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

export async function forgotPassword(input: z.infer<typeof forgotPasswordSchema>) {
  const [account] = await db`
    select p.id from profiles p
    join auth.users u on u.id = p.id
    where lower(u.email) = ${input.email} and p.age = ${input.age}
  `
  if (env.allowInsecureAgeReset) {
    if (!account) throw new AppError('Email and age do not match')
    if (!input.password) return { verified: true }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(String(account.id), { password: input.password })
    if (error) throw new AppError('Could not update password', 500)
    return { updated: true }
  }
  if (!account) return

  const redirectTo = new URL('/reset-password', env.webOrigins[0]).toString()
  const { error } = await supabaseAuth.auth.resetPasswordForEmail(input.email, { redirectTo })
  if (error) console.error('Password recovery email failed:', error.message)
}
