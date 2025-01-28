import { getCacheOptions } from '../utils/resolvers'
import {
	resolve,
	resolveStream,
	terminateStream,
	type ResolverOptions,
	type ResolverResult,
} from '..'

const CACHE_TRANSPORT_LEVEL = 'transport'

function createResolverStream(
	structure: ResolverResult<any, any>,
): ReadableStream<Uint8Array> {
	return new ReadableStream({
		async start(controller) {
			const iter = resolveStream(structure)
			let id = 0

			try {
				for await (const value of iter) {
					const event = createEventMessage(value, structure.options, id++)
					controller.enqueue(new TextEncoder().encode(event))
				}
			} catch (error) {
				const errorEvent = createEventMessage(
					{ message: error instanceof Error ? error.message : 'Unknown error' },
					structure.options,
					id,
					true,
				)
				controller.enqueue(new TextEncoder().encode(errorEvent))
			} finally {
				controller.close()
			}
		},
		cancel() {
			terminateStream(resolveStream(structure))
		},
	})
}

function createEventMessage(
	payload: unknown,
	options: ResolverOptions,
	id: number,
	error = false,
): string {
	return [
		`id: ${id}`,
		`event: ${options.id}`,
		`data: ${JSON.stringify({ payload, options, error })}`,
		'',
		'',
	].join('\n')
}

export async function createResolverResponse(
	structure: ResolverResult<any, any>,
): Promise<Response> {
	const { options, stream } = structure

	if (!stream) {
		try {
			const value = await resolve(structure)
			const content = JSON.stringify({ payload: value, options })
			const cacheOptions = getCacheOptions(options, 'remote')

			const headers: HeadersInit = {
				'Content-Type': 'application/json',
			}

			if (cacheOptions.level === CACHE_TRANSPORT_LEVEL) {
				headers['Cache-Control'] =
					`max-age=${Math.round(cacheOptions.ttl / 1000)}, public`
			}

			return new Response(content, { headers })
		} catch (error) {
			const content = JSON.stringify({
				payload: {
					message: error instanceof Error ? error.message : 'Unknown error',
				},
				options,
				error: true,
			})

			return new Response(content, {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			})
		}
	}

	return new Response(createResolverStream(structure), {
		headers: {
			'Content-Type': 'text/event-stream;charset=utf-8',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
		},
	})
}
