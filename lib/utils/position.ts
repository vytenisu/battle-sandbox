import {
  BOTTOM,
  BOTTOM_LEFT,
  BOTTOM_RIGHT,
  LEFT,
  RIGHT,
  TOP,
  TOP_LEFT,
  TOP_RIGHT,
} from '../constants/screeps'
import {IPosition} from '../types/common'

export class Position {
  public static fromRoomPosition(roomPosition: RoomPosition): IPosition {
    return {x: roomPosition.x, y: roomPosition.y}
  }

  public static hash(pos: IPosition): string {
    return `${pos.x}:${pos.y}`
  }

  public static decodeFromHash(hash: string): IPosition {
    const [x, y] = hash.split(':').map(Number)
    return {x, y}
  }

  public static equal(...positions: IPosition[]): boolean {
    const hashes = positions.map(pos => Position.hash(pos))
    return Boolean(hashes.every(hash => hash === hashes[0]))
  }

  public static near(a: IPosition, b: IPosition): boolean {
    return Boolean(
      Math.abs(a.x - b.x) <= 1 &&
        Math.abs(a.y - b.y) <= 1 &&
        !Position.equal(a, b),
    )
  }

  public static touching(a: IPosition, b: IPosition): boolean {
    return Boolean(
      (Math.abs(a.x - b.x) === 1 && a.y - b.y === 0) ||
        (a.x - b.x === 0 && Math.abs(a.y - b.y) === 1),
    )
  }

  public static moveToDirection(
    pos: IPosition,
    direction: DirectionConstant,
  ): IPosition {
    switch (direction) {
      case TOP:
        return {x: pos.x, y: pos.y - 1}
      case TOP_RIGHT:
        return {x: pos.x + 1, y: pos.y - 1}
      case RIGHT:
        return {x: pos.x + 1, y: pos.y}
      case BOTTOM_RIGHT:
        return {x: pos.x + 1, y: pos.y + 1}
      case BOTTOM:
        return {x: pos.x, y: pos.y + 1}
      case BOTTOM_LEFT:
        return {x: pos.x - 1, y: pos.y + 1}
      case LEFT:
        return {x: pos.x - 1, y: pos.y}
      case TOP_LEFT:
        return {x: pos.x - 1, y: pos.y - 1}
      default:
        return pos
    }
  }
}
