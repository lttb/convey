import type {createResolverFetcher} from '../client'
import type {getResolverHash} from '../utils/hash'

type Config = {
    cacheSize: number
    fetch: ReturnType<typeof createResolverFetcher>

    /**
     * Experimental. Common custom resolver hashing function
     */
    getResolverHash: typeof getResolverHash

    /**
     * Experimental. localStorage instance
     */
    localStorage: Storage | null
    /**
     * Experimental. sessionStorage implementation
     */
    sessionStorage: Storage | null
}

export const config: Config = {
    cacheSize: 100,
    fetch: () => [null] as any,
    getResolverHash: () => '',

    localStorage: typeof localStorage !== 'undefined' ? localStorage : null,
    sessionStorage:
        typeof sessionStorage !== 'undefined' ? sessionStorage : null,
}

export function setConfig(
    newConfig: Partial<Pick<Config, 'fetch' | 'getResolverHash'>>,
) {
    Object.assign(config, newConfig)
}
