import type { IncomingMessage, ServerResponse } from 'node:http'
import { getStructure, entityReviver } from '@convey/core'

import type { ResolverMap, ResolverRequestBody } from './types'
import { createResolverResponse } from './createResolverStream'

export function createResolverHandler(resolversMap: ResolverMap) {
	return async function handler(
		req: IncomingMessage,
		res: ServerResponse,
	): Promise<void> {
		let body: ResolverRequestBody
		const chunks: Buffer[] = []

		for await (const chunk of req) {
			chunks.push(Buffer.from(chunk))
		}

		try {
			const data = Buffer.concat(chunks).toString()
			const json = JSON.parse(data)
			body = { b: json.b }
		} catch {
			const url = new URL(req.url || '', 'http://localhost')
			body = { b: url.searchParams.get('b') || '{}' }
		}

		const { params, id } = JSON.parse(body.b, entityReviver)
		const resolverId = id in resolversMap ? id : id.split(':')[1]

		if (!resolversMap[resolverId]) {
			res.writeHead(404, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify({ error: 'Resolver not found' }))
			return
		}

		const structure = resolversMap[resolverId].apply({}, params)
		if (!structure) {
			res.writeHead(400, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify({ error: 'Invalid resolver structure' }))
			return
		}

		const response = await createResolverResponse(getStructure(structure))

		res.writeHead(response.status, Object.fromEntries(response.headers))

		if (!response.body) {
			res.end()
			return
		}

		const reader = response.body.getReader()
		try {
			while (true) {
				const { done, value } = await reader.read()
				if (done) break
				res.write(value)
			}
		} finally {
			reader.releaseLock()
			res.end()
		}
	}
}
