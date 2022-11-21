import {FATIGUE_LAND, FATIGUE_MOVE, FATIGUE_SWAMP} from './constants/screeps'
import {IPosition} from './types/common'
import {getNewMap} from './generator'
import {IFeed} from './types/feed'
import {EObjectType, ICreep, IObject} from './types/simplified-screeps'
import {Position} from './utils/position'
import {
  ECommand,
  ICommand,
  ICommandAttack,
  ICommandMove,
} from './types/commands'
import {sendMap} from './interface'

let map: IFeed | null = null

export const resetSimulation = async () => {
  map = await getNewMap()
  sendMap(map)
}

export const getCurrentMap = () => map

export const getScore = () => {
  const myCreeps = map.objects.filter(
    obj => obj.objectType === EObjectType.CREEP && obj.my,
  )

  const enemyCreeps = map.objects.filter(
    obj => obj.objectType === EObjectType.CREEP && !obj.my,
  )

  const positiveScore = myCreeps.reduce((sum, {body}) => sum + body.length, 0)

  const negativeScore = enemyCreeps.reduce(
    (sum, {body}) => sum + body.length,
    0,
  )

  return positiveScore - negativeScore
}

export const isConcluded = () => {
  const myFound = Boolean(
    map.objects.find(obj => obj.objectType === EObjectType.CREEP && obj.my),
  )

  const enemyFound = Boolean(
    map.objects.find(obj => obj.objectType === EObjectType.CREEP && !obj.my),
  )

  return !myFound || !enemyFound
}

export const runTick = (commands: ICommand[]) => {
  handleAge()
  decreaseFatigues()

  let candidateMap = JSON.parse(JSON.stringify(map))

  for (const command of commands) {
    candidateMap = handleCommand(command, candidateMap)

    if (candidateMap === false) {
      return false
    }
  }

  map = candidateMap
  sendMap(map)
  return true
}

const decreaseFatigues = () => {
  for (const obj of map.objects) {
    if (obj.objectType === EObjectType.CREEP) {
      const fatigueReduction = obj.body.reduce(
        (sum, {type, hits}) => sum + (hits && type === MOVE ? FATIGUE_MOVE : 0),
        0,
      )

      obj.fatigue = Math.max(0, obj.fatigue + fatigueReduction)
    }
  }
}

const handleAge = () => {
  const newObjects: IObject[] = []

  for (const objIndex in map.objects) {
    const obj = map.objects[objIndex]

    if (obj.objectType === EObjectType.CREEP) {
      obj.ticksToLive--

      if (obj.ticksToLive > 0) {
        newObjects.push(obj)
      }
    }
  }

  map.objects = newObjects
}

const handleCommand = (command: ICommand, referenceMap: IFeed) => {
  const handlers = {
    [ECommand.MOVE]: () =>
      handleMoveCommand(command as ICommandMove, referenceMap),
    [ECommand.ATTACK]: () =>
      handleAttackCommand(command as ICommandAttack, referenceMap),
  }

  return handlers[command.type]()
}

const handleMoveCommand = (
  command: ICommandMove,
  referenceMap: IFeed,
): boolean => {
  const creep = referenceMap.objects.find(
    ({objectType, id}) =>
      objectType === EObjectType.CREEP && id === command.payload.sourceId,
  )

  if (creep.fatigue) {
    return false
  }

  const targetPosition = Position.moveToDirection(
    creep.pos,
    command.payload.direction,
  )

  if (
    targetPosition.x < 0 ||
    targetPosition.x >= map.room.width ||
    targetPosition.y < 0 ||
    targetPosition.y >= map.room.height
  ) {
    return false
  }

  if (isWall(targetPosition)) {
    return false
  }

  const fatiguePerPart = isSwamp(creep.pos) ? FATIGUE_SWAMP : FATIGUE_LAND

  const additionalFatigue = creep.body.reduce(
    (sum, {type: bodyType, hits}) =>
      sum + (hits && bodyType === MOVE ? 0 : fatiguePerPart),
    0,
  )

  creep.pos = targetPosition as RoomPosition
  creep.fatigue += additionalFatigue

  return true
}

const isWall = (pos: IPosition) => getTerrain(pos) === TERRAIN_MASK_WALL

const isSwamp = (pos: IPosition) => getTerrain(pos) === TERRAIN_MASK_SWAMP

const getTerrain = (pos: IPosition) =>
  map.terrain[Position.hash(pos)]?.terrain ?? null

const handleAttackCommand = (
  command: ICommandAttack,
  referenceMap: IFeed,
): boolean => {
  const sourceCreep = referenceMap.objects.find(
    obj =>
      obj.objectType === EObjectType.CREEP &&
      obj.id === command.payload.sourceId,
  )

  const targetCreep = referenceMap.objects.find(
    obj =>
      obj.objectType === EObjectType.CREEP &&
      obj.id === command.payload.targetId,
  )

  if (!sourceCreep || !targetCreep) {
    return false
  }

  if (!Position.near(sourceCreep.pos, targetCreep.pos)) {
    return false
  }

  let sourceAttackPower = sourceCreep.body.reduce(
    (sum, {type, hits}) => sum + (hits && type === ATTACK ? ATTACK_POWER : 0),
    0,
  )

  let targetAttackPower = targetCreep.body.reduce(
    (sum, {type, hits}) => sum + (hits && type === ATTACK ? ATTACK_POWER : 0),
    0,
  )

  damageCreep(targetCreep, sourceAttackPower, referenceMap)
  damageCreep(sourceCreep, targetAttackPower, referenceMap)

  return true
}

const damageCreep = (
  targetCreep: ICreep,
  attackPower: number,
  referenceMap: IFeed,
) => {
  for (const part of targetCreep.body) {
    if (part.hits) {
      let reduceHits = Math.min(attackPower, part.hits)
      part.hits -= reduceHits
      attackPower -= reduceHits
    }

    if (!attackPower) {
      break
    }
  }

  const remainingTargetHits = targetCreep.body.reduce(
    (sum, {hits}) => sum + hits,
    0,
  )

  if (!remainingTargetHits) {
    referenceMap.objects = referenceMap.objects.filter(
      ({id}) => id !== targetCreep.id,
    )
  }
}
