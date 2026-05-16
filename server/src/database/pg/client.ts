import { Pool } from 'pg'

let pool: Pool | null = null

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL)
}

export function getDatabaseMode() {
  return hasDatabaseUrl() ? 'postgres' : 'memory'
}

export function getPgPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL 未配置')
  }

  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  return pool
}
