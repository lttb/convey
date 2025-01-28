import type { IncomingMessage, ServerResponse } from 'node:http'

import { getStructure, entityReviver } from '..'
import type { ResolverMap, ResolverRequestBody } from './types'
import { createResolverResponse } from './createResolverStream'

/**
 * Send body of response
 */
type Send<T> = (body: T) => void

type PatchedReq = IncomingMessage & { body?: any; query?: Record<string, any> }
type PatchedRes = ServerResponse & {
	status: (value: number) => PatchedRes
	json: Send<any>
}

export function createResolverHandler(resolversMap: ResolverMap) {
	return async function handler(
		req: PatchedReq,
		res: PatchedRes,
	): Promise<void> {
		const body: ResolverRequestBody = req.body?.b
			? { b: req.body.b }
			: { b: (req.query?.b as string) || '{}' }

		const { params, id } = JSON.parse(body.b, entityReviver)
		const resolverId = id in resolversMap ? id : id.split(':')[1]

		if (!resolversMap[resolverId]) {
			res.status(404).json({ error: 'Resolver not found' })
			return
		}

		const structure = resolversMap[resolverId].apply({}, params)
		if (!structure) {
			res.status(400).json({ error: 'Invalid resolver structure' })
			return
		}

		const response = await createResolverResponse(getStructure(structure))

		res.status(response.status)
		response.headers.forEach((value, key) => {
			res.setHeader(key, value)
		})

		if (!response.body) {
			res.end()
			return
		}

		const reader = response.body.getReader()

		let released = false
		const release = () => {
			if (released) return false

			released = true
			reader.cancel()
			reader.releaseLock()
		}

		res.on('close', () => {
			release()
		})

		try {
			while (true) {
				const { done, value } = await reader.read()
				if (done) break
				res.write(value)
			}
		} finally {
			release()
			res.end()
		}
	}
}
