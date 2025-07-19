import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import { createResolver, createResolverStream } from '@convey/core'

export const getDate = createResolver(
  async () => {
    const x = await promisify(exec)('date')
    return x.stdout.toString()
  },
  {
    cacheable: true,
  },
)

export const getDateStream = createResolverStream(async function* () {
  while (true) {
    yield await getDate()
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
})
