import './lib/constants/global'
import {connectToMapGeneration} from './lib/generator'
import {launchController} from './lib/controller'
import {ELogLevel, info, init} from './lib/utils/log'
import packageInfo from './package.json'
import {launchInterface} from './lib/interface'

init('Controller', ELogLevel.info)

info(`${packageInfo.name} ${packageInfo.version}`)
info(`by ${packageInfo.author.name}`)
;(async () => {
  await connectToMapGeneration()
  launchController()
  launchInterface()
})()
