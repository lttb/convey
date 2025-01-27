import { invalidate, subscribe, subscribeStream } from './utils/EventEmitter'

// TODO: exclude "createResolverFetcher" from the main bundle
import { createResolverFetcher } from './client'
import { getResolverHash } from './utils'
import { setConfig } from './config'

export * from './config'
export * from './utils'
export * from './utils/createResolver'
export * from './types'

setConfig({
	fetch: createResolverFetcher(),
	getResolverHash,
})

export { invalidate, subscribe, subscribeStream }
