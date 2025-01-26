import { getStructure } from '..'
import type { ResolverStructure } from '../types'

const paramsOrder = new Map<string, number>()

export function getParamsHash(params, hashed = new Set()) {
	if (hashed.has(params)) return '$cycle$'
	hashed.add(params)
	if (Array.isArray(params)) {
		return params.map((param) => getParamsHash(param, hashed)).join('_')
	}

	if (!params) return String(params)
	if (typeof params === 'function') return `%${params.name || ''}%`
	if (params.toJSON) return JSON.stringify(params.toJSON())
	if (typeof params !== 'object') {
		return String(params)
	}

	let hash = ''
	for (const param in params) {
		if (!paramsOrder.has(param)) {
			paramsOrder.set(param, paramsOrder.size)
		}

		hash += `$${paramsOrder.get(param)}:${getParamsHash(
			params[param],
			hashed,
		)}$`
	}
	return hash
}

const HASH_KEY = '__hash__'

export function getResolverHash(structure: ResolverStructure<any, any>) {
	if (!structure) {
		return ''
	}

	structure = getStructure(structure)

	// minor hash access optimization
	if (structure[HASH_KEY]) {
		return structure[HASH_KEY]
	}

	let hash

	if (structure.options.getHash) {
		hash = structure.options?.getHash(structure)
	} else {
		hash =
			getParamsHash(structure.params) + '/' + getParamsHash(structure.context)
	}

	structure[HASH_KEY] = hash

	return hash
}
