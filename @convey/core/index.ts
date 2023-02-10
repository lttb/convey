import {createResolverFetcher} from './client'
import {setConfig} from './config'
import type {Resolver} from './types'
// TODO: exclude "createResolverFetcher" from the main bundle
import {getResolverHash} from './utils'
import {invalidate, subscribe, subscribeStream} from './utils/EventEmitter'

export * from './config'
export * from './utils'
export * from './utils/createResolver'
export * from './types'

setConfig({
  fetch: createResolverFetcher(),
  getResolverHash,
})

export function buildResolverMap<R extends Resolver<any, any, any>>(
  resolvers: Record<string, R>,
) {
  return Object.values(resolvers).reduce((acc, resolver) => {
    acc[resolver.options.id] = resolver
    return acc
  }, {})
}

export {invalidate, subscribe, subscribeStream}
