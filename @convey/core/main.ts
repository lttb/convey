// TODO: exclude "createResolverFetcher" from the main bundle
import { createResolverFetcher } from './client'
import { setConfig } from './config'
import { getResolverHash } from './utils'
import { invalidate, subscribe, subscribeStream } from './utils/EventEmitter'

export * from './config'
export * from './types'
export * from './utils'
export * from './utils/createResolver'

setConfig({
  fetch: createResolverFetcher(),
  getResolverHash,
})

export { invalidate, subscribe, subscribeStream }
