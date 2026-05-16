import '../../load-env.js'
import { getPgPool } from './client.js'
import { schemaSql } from '../sql/schema.js'
import { seedDatabase } from './seed.js'

async function main() {
  const pool = getPgPool()
  await pool.query(schemaSql)
  await seedDatabase()
  console.log('[jiazi-daily-ai-server] database schema initialized')
  await pool.end()
}

void main()
