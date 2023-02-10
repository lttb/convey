import warning from 'warning'

import type {CancellableAsyncGenerator, CancellableGenerator} from '../types'

export const DONE: unique symbol = Symbol('done')
const UNSET = Symbol('unset')
const PENDING = Symbol('pending')
const ERROR = Symbol('error')

type UnsubType = (() => void) | void

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
    const iter = {next: null, reject: null, done: null}

    let unsub: typeof UNSET | UnsubType = UNSET

    let queue

    function terminate() {
        if (typeof unsub === 'function') unsub()
    }

    try {
        while (true) {
            queue = []

            let handlerSignal = await new Promise<
                | {status: typeof DONE | typeof PENDING}
                | {status: typeof ERROR; error: Error}
            >((promiseResolve) => {
                let id

                iter.next = (data) => {
                    queue.push(data)

                    if (id) clearTimeout(id)

                    id = setTimeout(() => {
                        promiseResolve({status: PENDING})
                    }, 0)
                }

                iter.reject = (error) => promiseResolve({status: ERROR, error})

                iter.done = (data) => {
                    // stop accepting data
                    iter.next = () => {
                        warning(
                            '[callbackToIter] The data has been sent after stream end',
                        )
                    }

                    queue.push(data)

                    promiseResolve({status: DONE})
                }

                if (unsub === UNSET) {
                    unsub = handlerCreator({
                        next: (data) => iter.next(data),
                        done: (data) => iter.done(data),
                        reject: (error) => iter.reject(error),
                    })
                }
            })

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
