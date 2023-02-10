import {createResolver} from '@convey/core'
import {exec} from 'child_process'
import {promisify} from 'util'

const getDate = () => promisify(exec)('date').then((x) => x.stdout.toString())

export const getServerDate = createResolver(async function () {
    return getDate()
})
