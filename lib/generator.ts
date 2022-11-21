import {client as Client, connection} from 'websocket'
import {
  CREEPS_MAX,
  CREEPS_MIN,
  ROOM_HEIGHT,
  ROOM_WIDTH,
  TERRAIN_SWAMP_GROW_MAX,
  TERRAIN_SWAMP_GROW_MIN,
  TERRAIN_SWAMP_INITIAL_MAX,
  TERRAIN_SWAMP_INITIAL_MIN,
  TERRAIN_WALL_GROW_MAX,
  TERRAIN_WALL_GROW_MIN,
  TERRAIN_WALL_INITIAL_MAX,
  TERRAIN_WALL_INITIAL_MIN,
  WS_URL_MAP_GENERATION,
} from './config'
import {IFeed} from './types/feed'
import {debug, error, verbose} from './utils/log'

const RETRY_DELAY = 3000

let currentConnectionResolve: (data: void) => void = () => {}
let currentResolve: (data: IFeed) => void = () => {}
let currentConnection: connection | null = null

const client = new Client()

const connect = () => {
  verbose('Connecting to map generation service...')
  client.connect(WS_URL_MAP_GENERATION, 'map-generation')
}

const retry = () => setTimeout(connect, RETRY_DELAY)

client.on('connectFailed', () => {
  error('Connection to map generator service failed!')
  retry()
})

client.on('connect', connection => {
  currentConnection = connection
  currentConnectionResolve()
  verbose('Connected to map generation service!')

  connection.on('error', e => {
    error('Error occurred in connection with map generation service!')
    error(e.toString())
  })

  connection.on('close', () => {
    error('Connection to map generation service was closed!')
    retry()
  })

  connection.on('message', message => {
    if (message.type === 'utf8') {
      verbose('Received new map!')
      debug(message.utf8Data)
      currentResolve(JSON.parse(message.utf8Data))
    } else {
      error('Received unexpected binary message from map generation service!')
    }
  })
})

export const getNewMap = async (): Promise<IFeed> =>
  new Promise(resolve => {
    currentResolve = resolve

    if (currentConnection?.connected) {
      verbose('Requesting new map...')
      const payload = JSON.stringify({
        room: {width: ROOM_WIDTH, height: ROOM_HEIGHT},
        terrain: {
          initialWallMinAmount: TERRAIN_WALL_INITIAL_MIN,
          initialWallMaxAmount: TERRAIN_WALL_INITIAL_MAX,
          initialSwampMinAmount: TERRAIN_SWAMP_INITIAL_MIN,
          initialSwampMaxAmount: TERRAIN_SWAMP_INITIAL_MAX,
          growWallMinAmount: TERRAIN_WALL_GROW_MIN,
          growWallMaxAmount: TERRAIN_WALL_GROW_MAX,
          growSwampMinAmount: TERRAIN_SWAMP_GROW_MIN,
          growSwampMaxAmount: TERRAIN_SWAMP_GROW_MAX,
        },
        creeps: {
          ownMinAmount: CREEPS_MIN,
          ownMaxAmount: CREEPS_MAX,
          enemyMinAmount: CREEPS_MIN,
          enemyMaxAmount: CREEPS_MAX,
        },
      })

      debug(payload)
      currentConnection.sendUTF(payload)
    } else {
      error('Requesting for new map while not connected to generation service!')
    }
  })

export const connectToMapGeneration = () =>
  new Promise(resolve => {
    currentConnectionResolve = resolve
    connect()
  })
