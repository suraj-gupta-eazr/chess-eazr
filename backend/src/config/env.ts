const required = (name: string) => {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

export const env = {
  databaseUrl: required('DATABASE_URL'),
  supabaseUrl: required('SUPABASE_URL'),
  supabaseAnonKey: required('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  webOrigins: (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',').map((origin) => origin.trim()),
  // ponytail: local-only test escape hatch; Vercel and production always disable it.
  allowInsecureAgeReset: process.env.ALLOW_INSECURE_AGE_RESET === 'true' && !process.env.VERCEL && process.env.NODE_ENV !== 'production',
  port: Number(process.env.PORT ?? 3000),
}
