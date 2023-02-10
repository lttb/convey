/* eslint-disable @typescript-eslint/no-unused-vars */

import {config} from '../config'

import {invalidate} from './EventEmitter'
import {LRUCache} from './LRUCache'

const CACHE_KEY_PREFIX = '__CONVEY__'
const getCacheKey = (structure, hash) =>
  `${CACHE_KEY_PREFIX}:${structure.options.id}:${hash}`

type ResolverType = 'local' | 'remote'

export function getCacheOptions(options, type: ResolverType) {
  const {cacheable} = options

  if (!cacheable) return false

  if (type === 'remote') {
    return cacheable.remote || (!cacheable.local && cacheable)
  }

  return cacheable.local || (!cacheable.remote && cacheable)
}

class StorageCache<K = any, V = any> {
  storage?: Storage

  constructor(storage?: Storage) {
    this.storage = storage
  }

  has(structure, hash) {
    const key = getCacheKey(structure, hash)
    const item = this.storage?.getItem(key)

    if (item == null) return false

    const liveUntil = JSON.parse(item).liveUntil

    if (Date.now() > liveUntil) {
      this.delete(structure, hash)

      return false
    }

    return true
  }
  get(structure, hash) {
    return JSON.parse(
      this.storage?.getItem(getCacheKey(structure, hash)) || '{}',
    ).value
  }
  set(structure, hash, value, ttl) {
    return this.storage?.setItem(
      getCacheKey(structure, hash),
      JSON.stringify({value, ttl, liveUntil: Date.now() + ttl}),
    )
  }
  delete(structure, hash) {
    this.storage?.removeItem(getCacheKey(structure, hash))
  }
}

type Data<T> = T | Promise<T>

const DEFAULT_TTL = 150

const CACHE_TRANSPORT_LEVEL = 'transport'

export class LocalCache {
  size: number

  ttlCache: Map<any, any>
  optionsCache: Map<any, any>
  resolverCache: Map<any, LRUCache<string, any>>
  localStorageCache: StorageCache<any, any>
  sessionStorageCache: StorageCache<any, any>

  constructor() {
    this.size = config.cacheSize

    this.resolverCache = new Map()

    this.optionsCache = new Map()
    this.ttlCache = new Map()

    this.localStorageCache = new StorageCache(config.localStorage)
    this.sessionStorageCache = new StorageCache(config.sessionStorage)
  }

  // initCaches(st: StorageCache) {
  //     Object.keys({...st}).forEach((key) => {
  //         if (!key.startsWith(`${CACHE_KEY_PREFIX}:`)) return;
  //     });
  // }

  has(structure) {
    const hash = config.getResolverHash(structure)

    return (
      this.sessionStorageCache.has(structure, hash) ||
      this.localStorageCache.has(structure, hash) ||
      !!this.resolverCache.get(structure.resolver)?.has(hash)
    )
  }

  get(structure) {
    const hash = config.getResolverHash(structure)

    return (
      this.sessionStorageCache.get(structure, hash) ||
      this.localStorageCache.get(structure, hash) ||
      this.resolverCache.get(structure.resolver)?.get(hash)
    )
  }

  delete(structure) {
    const hash = config.getResolverHash(structure)

    this.sessionStorageCache.delete(structure, hash)
    this.localStorageCache.delete(structure, hash)
    this.resolverCache.get(structure.resolver)?.delete(hash)
  }

  set(
    structure,
    data: Data<{
      payload: any
      options: any
      type: ResolverType
      error?: boolean
    }>,
  ) {
    if (!this.resolverCache.has(structure.resolver)) {
      this.resolverCache.set(structure.resolver, new LRUCache(this.size))
    }

    const cache = this.resolverCache.get(structure.resolver)
    const hash = config.getResolverHash(structure)

    data = Promise.resolve(data)

    cache.set(
      hash,
      data.then((x) => {
        if (x.error) {
          throw x.payload
        }

        invalidate(structure)

        return x.payload
      }),
    )

    data.then(({options, payload, type}) => {
      const cacheable = getCacheOptions(options, type)

      if (!cacheable) {
        cache.delete(hash)

        return
      }

      let ttl = DEFAULT_TTL

      // experimental transport level caching support
      if (cacheable.level !== CACHE_TRANSPORT_LEVEL && cacheable.ttl > 0) {
        ttl = cacheable.ttl
      }

      if (cacheable.level === 'localStorage') {
        this.localStorageCache.set(structure, hash, payload, ttl)
      } else if (cacheable.level === 'sessionStorage') {
        this.sessionStorageCache.set(structure, hash, payload, ttl)
      }

      if (!Number.isFinite(ttl)) {
        return
      }

      // TODO: cancel prev timeout
      setTimeout(() => {
        cache.delete(hash)
      }, ttl)
    })
  }
}
