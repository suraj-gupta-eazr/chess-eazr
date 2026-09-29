import postgres, { type TransactionSql } from 'postgres'
import { env } from './env.js'

// Vercel functions share this single pooled connection while an instance is warm.
export const db = postgres(env.databaseUrl, {
  max: 1,
  prepare: false,
  ssl: 'require',
})

export type Transaction = TransactionSql<Record<string, never>>
