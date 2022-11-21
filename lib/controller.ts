import {debug, verbose, warn} from './utils/log'
import {createServer} from 'http'
import {CONTROLLER_LISTEN_PORT} from './config'
import {
  connection,
  IUtf8Message,
  Message,
  request,
  server as Server,
} from 'websocket'

export const launchController = () => {
  const server = createServer((_, res) => {
    res.writeHead(404)
    res.end()
  })

  server.listen(CONTROLLER_LISTEN_PORT, () => {
    verbose(`Controller listening on ${CONTROLLER_LISTEN_PORT}`)
  })

  const socket = new Server({
    httpServer: server,
    autoAcceptConnections: false,
  })

  socket.on('request', (req: request) => {
    verbose(`Controller connection request received (${req.origin})`)

    if (!allowed(req)) {
      req.reject()
      warn(`Request was blocked! ${req.origin}`)
      return
    }

    const connection = req.accept('controller', req.origin)
    verbose(`Accepted controller request (${connection.remoteAddress})`)

    connection.on('message', async (message: Message) => {
      if (message.type === 'binary') {
        warn(
          `Ignoring received binary controller message! (${connection.remoteAddress})`,
        )
        warn(`Binary messages are not accepted!`)
        return
      }

      verbose(`Received controller command (${connection.remoteAddress})`)

      const utfMessage = message as IUtf8Message
      debug(utfMessage.utf8Data)

      // await handleMessage(utfMessage.utf8Data, connection)
    })

    connection.on('close', (reason, description) => {
      warn(`Controller connection closed! (${connection.remoteAddress})`)
      verbose(`Reason: ${description} (${reason})`)
    })
  })
}

const handleMessage = async (json: string, connection: connection) => {
  // verbose(`Requesting map from cache (${connection.remoteAddress})`)
  // let map: IFeed
  // try {
  //   const config = JSON.parse(json)
  //   map = await getMap(config)
  // } catch (e) {
  //   error('Failed to retrieve map from cache!')
  //   error(e.toString())
  // }
  // verbose(`Sending map (${connection.remoteAddress})`)
  // const stringMap = JSON.stringify(map)
  // debug(stringMap)
  // connection.sendUTF(stringMap)
  // verbose(`Map was sent (${connection.remoteAddress})`)
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
