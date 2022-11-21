import {debug, error, verbose, warn} from './utils/log'
import {createServer} from 'http'
import {CONTROLLER_LISTEN_PORT} from './config'
import {IUtf8Message, Message, request, server as Server} from 'websocket'
import {
  EControllerCommand,
  IControllerCommand,
  IControllerResponse,
} from './types/commands'
import {
  getCurrentMap,
  getScore,
  isConcluded,
  resetSimulation,
  runTick,
} from './simulator'

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

      try {
        let command: IControllerCommand = JSON.parse(utfMessage.utf8Data)

        verbose('Executing command...')
        const commandSucceeded = await handleCommand(command)
        const map = getCurrentMap()
        const score = getScore()
        const concluded = isConcluded()

        verbose('Command executed!')
        verbose('Sending results...')

        const result: IControllerResponse = {
          map,
          commandSucceeded,
          score,
          concluded,
        }

        const stringResult = JSON.stringify(result)

        debug(stringResult)
        connection.sendUTF(stringResult)

        verbose('Results sent!')
      } catch (e) {
        error('Failed to execute controller command!')
        error('Reason: ' + e.toString())
        throw e
      }
    })

    connection.on('close', (reason, description) => {
      warn(`Controller connection closed! (${connection.remoteAddress})`)
      verbose(`Reason: ${description} (${reason})`)
    })
  })
}

const handleCommand = async (command: IControllerCommand) => {
  if (command.type === EControllerCommand.RESET) {
    verbose('Resetting simulator...')
    await resetSimulation()
    verbose('Simulator was reset!')
    return true
  } else if (command.type === EControllerCommand.TICK) {
    return runTick(command.payload, true)
  } else {
    return false
  }
}

const allowed = (req: request) => {
  if (
    !req.origin?.includes('127.0.0.1') &&
    !req.origin?.includes('localhost') &&
    req.remoteAddress !== '::1' &&
    req.remoteAddress !== '::ffff:127.0.0.1'
  ) {
    return false
  } else {
    return true
  }
}
