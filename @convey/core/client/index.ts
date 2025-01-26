import { stream } from 'fetch-event-stream'

import { entityReviver } from '../utils'
import type { CancellableAsyncGenerator, ResolverOptions } from '../types'

const EventStreamContentType = 'text/event-stream'
const JSONContentType = 'application/json'

type MessageData = {
	options: ResolverOptions
	// biome-ignore lint/suspicious/noExplicitAny:
	payload: any
	error?: boolean
}

type Message = {
	stream?: boolean
	data?: MessageData
}
type FetchedResolver = {
	// biome-ignore lint/suspicious/noExplicitAny:
	params: any
	options: ResolverOptions
	stream: boolean
}

type RequestHeaders = Record<string, string>

export function createResolverFetcher({
	url,
	reviver = entityReviver,
	headers = {},
}: {
	url?: string | ((structure: FetchedResolver) => string)
	openWhenHidden?: boolean
	reviver?: typeof entityReviver
	headers?: RequestHeaders | ((structure: FetchedResolver) => RequestHeaders)
} = {}) {
	return async function* fetchResolver(
		structure: FetchedResolver,
	): CancellableAsyncGenerator<Message> {
		const abort =
			typeof AbortController !== 'undefined' ? new AbortController() : null

		const {
			params,
			options: { id },
		} = structure

		const link =
			typeof url === 'function' ? url(structure) : url || `/api/resolver/${id}`

		const body = JSON.stringify({ params, id })

		const events = await stream(link, {
			method: 'POST',
			headers: {
				accept: [JSONContentType, EventStreamContentType].join(', '),
				'content-type': JSONContentType,

				...(typeof headers === 'function' ? headers(structure) : headers),
			},
			body,
			signal: abort?.signal,
		})

		for await (const event of events) {
			if (!event.data) continue

			yield { data: JSON.parse(event.data, reviver) }
		}
	}
}
