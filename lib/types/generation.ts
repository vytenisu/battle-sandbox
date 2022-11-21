import {IRoom} from './feed'

export interface IRoomGenerationProps {
  room: IRoom
  terrain: ITerrainGenerationProps
  creeps: ICreepGenerationProps
}

export interface ITerrainGenerationProps {
  initialWallMinAmount: number
  initialWallMaxAmount: number
  initialSwampMinAmount: number
  initialSwampMaxAmount: number
  growWallMinAmount: number
  growWallMaxAmount: number
  growSwampMinAmount: number
  growSwampMaxAmount: number
}

export interface ICreepGenerationProps {
  ownMinAmount: number
  ownMaxAmount: number
  enemyMinAmount: number
  enemyMaxAmount: number
}
