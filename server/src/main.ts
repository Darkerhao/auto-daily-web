import './load-env.js'
import { createServer } from 'node:http'
import { createApp } from './app.js'

const port = Number(process.env.PORT ?? 3000)
const app = createApp()
const server = createServer(app)

server.listen(port, () => {
  console.log(`[jiazi-daily-ai-server] listening on http://0.0.0.0:${port}`)
})
