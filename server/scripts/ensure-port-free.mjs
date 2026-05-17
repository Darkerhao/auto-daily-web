import net from 'node:net'

const port = Number(process.argv[2] ?? process.env.PORT ?? 3000)

function canListen(targetPort) {
  return new Promise((resolve) => {
    const server = net.createServer()

    server.once('error', () => {
      resolve(false)
    })

    server.once('listening', () => {
      server.close(() => resolve(true))
    })

    server.listen(targetPort, '0.0.0.0')
  })
}

const free = await canListen(port)

if (!free) {
  console.error(`[ensure-port-free] port ${port} is already in use`)
  process.exit(1)
}

console.log(`[ensure-port-free] port ${port} is available`)
