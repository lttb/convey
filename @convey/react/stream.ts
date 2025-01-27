import {
	type ResolverResult,
	config,
	getStructure,
	invalidate as invalidateResolver,
} from '@convey/core'
import { LocalCache } from '@convey/core/utils/LocalCache'
import { useResolver as useResolverCore } from './index'
import { useAsync } from 'react-streaming'

const resolverCache = new Map<any, Map<string, any>>()

const resolverCacheGet = (struct: any) => {
	const hash = config.getResolverHash(struct)
	return resolverCache.get(struct.resolver)?.get(hash)
}
const resolverCacheSet = (struct: any, value: any) => {
	const hash = config.getResolverHash(struct)
	let map = resolverCache.get(struct.resolver)
	if (!map) {
		map = new Map()
		resolverCache.set(struct.resolver, map)
	}
	map.set(hash, value)
}
const resolverCacheHas = (struct: any) => {
	return !!resolverCacheGet(struct)
}
const resolverCacheDelete = (struct: any) => {
	const hash = config.getResolverHash(struct)
	const map = resolverCache.get(struct.resolver)
	map?.delete(hash)
	if (map?.size === 0) {
		resolverCache.delete(struct.resolver)
	}
}

const originalHas = LocalCache.prototype.has
const originalGet = LocalCache.prototype.get

LocalCache.prototype.has = function (struct) {
	if (resolverCacheHas(struct) && !originalHas.call(this, struct)) return true
	return originalHas.call(this, struct)
}

LocalCache.prototype.get = function (struct) {
	if (!originalHas.call(this, struct)) {
		return resolverCacheGet(struct)
	}
	return originalGet.call(this, struct)
}

export async function invalidate<Result, Params extends any[] = any[]>(
	resolver: ResolverResult<Result, Params>,
) {
	const struct = getStructure(resolver)
	resolverCacheDelete(struct)
	return invalidateResolver(resolver)
}

export function useResolver<Result, Params extends any[] = any[]>(
	resolver: null | ResolverResult<Result, Params>,
) {
	const data = useAsync(
		[resolver?.options.id, ...(resolver?.params || [])],
		() => resolver,
	)

	const struct = getStructure(resolver)

	if (typeof window !== 'undefined' && !resolverCacheHas(struct)) {
		resolverCacheSet(struct, data)
	}

	const [result = data, meta] = useResolverCore(resolver)

	return [result, meta] as const
}
