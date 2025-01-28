import type { CancellableAsyncGenerator, CancellableGenerator } from '../types'

export const DONE: unique symbol = Symbol('done')
const UNSET = Symbol('unset')
const PENDING = Symbol('pending')
const ERROR = Symbol('error')

type UnsubType = (() => void) | undefined

export function terminateStream<V>(
	iter: CancellableGenerator<V> | CancellableAsyncGenerator<V>,
) {
	// iter.next(true);

	iter.return(undefined)
}

export async function* callbackToIter<V, E extends Error = Error>(
	handlerCreator: (commands: {
		next: (data: V) => void
		done: (data: V) => void
		reject: (error: E) => void
	}) => UnsubType,
): CancellableAsyncGenerator<V> {
	let unsub: typeof UNSET | UnsubType = UNSET

	let queue: V[]

	function terminate() {
		if (typeof unsub === 'function') unsub()
	}

	try {
		while (true) {
			queue = []

			const handlerSignal = await new Promise<
				| { status: typeof DONE | typeof PENDING }
				| { status: typeof ERROR; error: Error }
			>((promiseResolve) => {
				let id: Timer

				const iter = {
					next: (data: V) => {
						queue.push(data)

						if (id) clearTimeout(id)

						id = setTimeout(() => {
							promiseResolve({ status: PENDING })
						}, 0)
					},

					reject: (error: E) => promiseResolve({ status: ERROR, error }),

					done: (data: V) => {
						// stop accepting data
						iter.next = () => {
							// warning('[callbackToIter] The data has been sent after stream end')
						}

						queue.push(data)

						promiseResolve({ status: DONE })
					},
				}

				if (unsub === UNSET) {
					unsub = handlerCreator({
						next: (data) => iter.next(data),
						done: (data) => iter.done(data),
						reject: (error) => iter.reject(error),
					})
				}
			})

			// @ts-ignore
			yield* queue

			if (handlerSignal.status === ERROR) {
				terminate()

				throw handlerSignal.error
			}

			if (handlerSignal.status === DONE) {
				terminate()

				return
			}
		}
	} finally {
		terminate()
	}
}
