import './load-env.js'
import { createServer } from 'node:http'
import { createApp } from './app.js'
import { getPgPool, hasDatabaseUrl } from './database/pg/client.js'

const port = Number(process.env.PORT ?? 3000)
const app = createApp()
const server = createServer(app)

server.listen(port, () => {
  console.log(`[jiazi-daily-ai-server] listening on http://0.0.0.0:${port}`)
})

async function shutdown(signal: string) {
  console.log(`[jiazi-daily-ai-server] received ${signal}, shutting down`)

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })

  if (hasDatabaseUrl()) {
    await getPgPool().end()
  }

  process.exit(0)
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void shutdown(signal)
  })
}
