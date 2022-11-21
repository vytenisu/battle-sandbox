import {debug, verbose, warn} from './utils/log'
import {createServer} from 'http'
import {INTERFACE_LISTEN_PORT} from './config'
import {connection, request, server as Server} from 'websocket'
import {IFeed} from './types/feed'

let currentConnection: connection | null = null

export const launchInterface = () => {
  const server = createServer((_, res) => {
    res.writeHead(404)
    res.end()
  })

  server.listen(INTERFACE_LISTEN_PORT, () => {
    verbose(`Interface listening on ${INTERFACE_LISTEN_PORT}`)
  })

  const socket = new Server({
    httpServer: server,
    autoAcceptConnections: false,
  })

  socket.on('request', (req: request) => {
    verbose(`Interface connection request received (${req.origin})`)

    if (!allowed(req)) {
      req.reject()
      warn(`Request was blocked! ${req.origin}`)
      return
    }

    const connection = req.accept('interface', req.origin)
    currentConnection = connection
    verbose(`Accepted interface request (${connection.remoteAddress})`)

    connection.on('message', async () => {
      warn(`Interface messages are not accepted - this is a read-only feed!`)
    })

    connection.on('close', (reason, description) => {
      warn(`Interface connection closed! (${connection.remoteAddress})`)
      verbose(`Reason: ${description} (${reason})`)
    })
  })
}

export const sendMap = (map: IFeed) => {
  if (currentConnection?.connected) {
    verbose('Sending map feed interface message...')
    const stringMap = JSON.stringify(map)
    debug(stringMap)
    currentConnection.sendUTF(stringMap)
    verbose('Interface map feed sent!')
  }
}

const allowed = (req: request) => {
  if (
    !req.origin?.includes('127.0.0.1') &&
    !req.origin?.includes('localhost') &&
    req.remoteAddress !== '::1'
  ) {
    return false
  } else {
    return true
  }
}
