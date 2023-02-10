import {exec} from 'child_process'
import {promisify} from 'util'

import {createResolver} from '@convey/core'

const getDate = () => promisify(exec)('date').then((x) => x.stdout.toString())

export const getServerDate = createResolver(async function () {
  return getDate()
})
