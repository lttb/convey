export class _Promise<T> extends Promise<T> {
	resolve: (value?: T) => void
	reject: <E extends Error>(error: E) => void

	// @ts-expect-error
	constructor() {
		let _resolve
		let _reject

		const promise: any = new Promise((resolve, reject) => {
			_resolve = resolve
			_reject = reject
		})

		promise.resolve = _resolve
		promise.reject = _reject

		return promise
	}
}
