import { useState, useEffect } from 'react'

import {
	subscribeStream,
	subscribe,
	resolveStream,
	config,
	getStructure,
	_Promise,
} from '@convey/core'

import type {
	Unbox,
	ResolverResult,
	CancellableAsyncGenerator,
} from '@convey/core'

type MetaBase<Result> = { refresh: () => Result }

type HookResult<Result> =
	| [Unbox<Result>, MetaBase<Result> & { status: 'DONE' }]
	| [
			undefined,
			MetaBase<Result> &
				({ status: 'PENDING' | 'UNSET' } | { status: 'ERROR'; error: Error }),
	  ]

export function useResolver<Result, Params extends any[] = any[]>(
	resolver: null | ResolverResult<Result, Params>,
): HookResult<Result>

export function useResolver<Result, Params extends any[] = any[]>(
	str: null | ResolverResult<Result, Params>,
) {
	const structure = getStructure(str)

	const { resolver } = structure ?? {}

	const [resultPromise, setResultPromise] = useState<_Promise<any> | null>(null)
	const [meta, setMeta] = useState<HookResult<any>[1]>({
		status: 'UNSET',
		refresh: async () => {
			const newResultPromise = new _Promise()
			setResultPromise(newResultPromise)

			return newResultPromise
		},
	})
	const [data, setData] = useState(undefined)

	// biome-ignore lint/correctness/useExhaustiveDependencies: recalculate on hash change too
	useEffect(() => {
		if (!resolver) return

		let iter: CancellableAsyncGenerator<any>
		let finished = false

		async function main() {
			setMeta((meta) => ({ ...meta, status: 'PENDING' }))

			if (structure.stream) {
				if (typeof resolver === 'function') {
					iter = resolveStream(structure)
				} else {
					iter = subscribeStream(structure)
				}
			} else {
				iter = subscribe(structure)
			}

			try {
				for await (const value of iter) {
					if (finished) return

					setData(() => value)
					setMeta((meta) => ({ ...meta, status: 'DONE' }))
					resultPromise?.resolve(value)
				}
			} catch (error: any) {
				setMeta((meta) => ({ ...meta, status: 'ERROR', error }))
				resultPromise?.reject(error)
			}
		}

		main()

		return () => {
			finished = true

			iter.return(null)
		}
	}, [resolver, config.getResolverHash(structure), resultPromise])

	return [data, meta] as any
}
