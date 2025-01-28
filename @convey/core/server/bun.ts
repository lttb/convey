import { getStructure, entityReviver } from '..'
import type { ResolverMap, ResolverRequestBody } from './types'
import { createResolverResponse } from './createResolverStream'

export function createResolverHandler(resolversMap: ResolverMap) {
	return async (req: Request): Promise<Response> => {
		let body: ResolverRequestBody

		try {
			const json = await req.json()
			body = { b: json.b }
		} catch {
			const url = new URL(req.url)
			body = { b: url.searchParams.get('b') || '{}' }
		}

		const { params, id } = JSON.parse(body.b, entityReviver)
		const resolverId = id in resolversMap ? id : id.split(':')[1]

		if (!resolversMap[resolverId]) {
			return new Response(JSON.stringify({ error: 'Resolver not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		const structure = resolversMap[resolverId].apply({}, params)

		return createResolverResponse(getStructure(structure))
	}
}
