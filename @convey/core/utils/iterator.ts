class _Promise<T> extends Promise<T> {
    resolve: (value?: T) => void
    reject: <E extends Error>(error: E) => void
    constructor(cb = () => {}) {
        super(cb)

        const promise: any = new Promise((resolve, reject) => {
            promise.resolve = resolve
            promise.reject = reject
        })

        return promise
    }
}

const FINISHED = Symbol('finished')
const TERMINATE = Symbol('terminate')

// TODO: think about queue as in callbackToIter
// provide some examples white it might replace generators
/**
 * TODO: think about queue as in callbackToIter
 * TODO: provide some examples white it might replace generators
 *
 * for example, if we yield promise in async generator, then finally will wait for it to resolve
 * async function* inc() { try { while (true) { yield wait(2000) } } finally { console.log('done') } }
 * let x = inc(); x.next(); x.return() // after 2 sec
 */
export async function* createIterator(iter) {
    let result = new _Promise()
    let ticker = new _Promise()
    // let queue = []
    let done = false
    let clear

    function terminate() {
        if (clear) clear()

        done = true
    }

    function next(value) {
        if (done) {
            throw TERMINATE
        }

        result.resolve(value)

        return ticker
    }

    Object.defineProperty(next, 'drop', {
        get() {
            return () => {
                terminate()
            }
        },
        set(value) {
            clear = value
        },
    })

    Promise.resolve(iter(next))
        .then(() => {
            result.resolve(FINISHED)
        })
        .catch((e) => {
            if (e === TERMINATE) {
                result.resolve(FINISHED)
                return
            }

            result.reject(e)
        })

    try {
        while (true) {
            let value = await result

            if (value === FINISHED) {
                return
            }

            yield value
            ticker.resolve()

            ticker = new _Promise()
            result = new _Promise()
        }
    } finally {
        terminate()
    }
}
