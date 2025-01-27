import { entityReviver } from '../utils'
import type { CancellableAsyncGenerator, ResolverOptions } from '../types'

const EventStreamContentType = 'text/event-stream'
const JSONContentType = 'application/json'

type MessageData = {
	options: ResolverOptions
	payload: any
	error?: boolean
}

type Message = {
	stream?: boolean
	data?: MessageData
}

type FetchedResolver = {
	params: any
	options: ResolverOptions
	stream: boolean
}

type RequestHeaders = Record<string, string>

const originalFetch = fetch

type UniversalFetch = (
	link: string,
	options?: {
		body?: BodyInit
		credentials?: RequestCredentials // same-origin is not supported
		headers?: HeadersInit
		method?: string
		signal?: AbortSignal
	},
) => Promise<any> // should be Promise<Response> but it's not fully compatible with react-native types

export function createResolverFetcher({
	url,
	reviver = entityReviver,
	headers = {},
	fetch: customFetch = originalFetch,
}: {
	url?: string | ((structure: FetchedResolver) => string)
	openWhenHidden?: boolean
	reviver?: typeof entityReviver
	headers?: RequestHeaders | ((structure: FetchedResolver) => RequestHeaders)
	fetch?: UniversalFetch
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
			typeof url === 'function' ? url(structure) : url || `/api/resolvers/${id}`

		const body = JSON.stringify({ b: JSON.stringify({ params, id }) })

		const result = (await customFetch(link, {
			method: 'POST',
			headers: {
				accept: [JSONContentType, EventStreamContentType].join(', '),
				'content-type': JSONContentType,
				...(typeof headers === 'function' ? headers(structure) : headers),
			},
			body,
			signal: abort?.signal,
		})) as Response

		const isEventStream = result.headers
			.get('content-type')
			?.includes('text/event-stream')

		if (!isEventStream) {
			const data = JSON.parse(await result.text(), reviver)
			yield { data }
			return
		}

		const reader = result.body?.getReader?.()

		if (!reader) return

		const decoder = new TextDecoder()
		let buffer = ''

		try {
			while (true) {
				const { done, value } = await reader.read()

				if (done) {
					if (buffer.trim()) {
						const data = parseEventData(buffer, reviver)
						if (data) yield { data }
					}
					break
				}

				buffer += decoder.decode(value, { stream: true })
				const events = buffer.split('\n\n')
				buffer = events.pop() || ''

				for (const event of events) {
					if (!event.trim()) continue
					const data = parseEventData(event, reviver)
					if (data) yield { data }
				}
			}
		} finally {
			reader.releaseLock()
		}
	}
}

function parseEventData(
	eventText: string,
	reviver: typeof entityReviver,
): MessageData | null {
	const lines = eventText.split('\n')
	let data = ''

	for (const line of lines) {
		if (line.startsWith('data: ')) {
			data += line.slice(6)
		}
	}

	if (!data) return null

	try {
		return JSON.parse(data, reviver)
	} catch (error) {
		console.error('Failed to parse event data:', error)
		return null
	}
}
