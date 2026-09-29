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
  port: Number(process.env.PORT ?? 3000),
}
