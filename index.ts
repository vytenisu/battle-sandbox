import {connectToMapGeneration} from './lib/generator'
import {ELogLevel, init} from './lib/utils/log'

init('Controller', ELogLevel.verbose)
;(async () => {
  await connectToMapGeneration()
  // setInterval(() => {
  //   getNewMap()
  // }, 7000)
})()

// TODO: NOT FINISHED
