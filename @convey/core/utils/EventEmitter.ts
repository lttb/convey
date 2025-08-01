import { config } from '../config'
import type {
  AnyStructure,
  CancellableAsyncGenerator,
  Resolver,
  Unbox,
} from '../types'
import { callbackToIter, terminateStream } from './callbackToIter'
import { getStructure } from './createResolver'
import { resolve, resolveStream } from './resolvers'

export class EventEmitter {
  list: Map<any, Record<string, any>>
  streams: Map<any, Record<string, any>>

  constructor() {
    this.list = new Map()
    this.streams = new Map()
  }

  private async runGenerator(structure: AnyStructure) {
    for await (const value of resolveStream(structure)) {
      // @ts-expect-error TODO: fix
      this.emit(structure, value)
    }
  }

  private async *subscribeGeneral<Params extends any[], Result>(
    structure: ReturnType<Resolver<Result, Params>>,
  ): CancellableAsyncGenerator<Unbox<Result>> {
    const { resolver, params } = structure

    const hash = config.getResolverHash(structure)

    if (!this.list.has(resolver)) {
      this.list.set(resolver, {})
    }
    // biome-ignore lint/style/noNonNullAssertion: set already
    const listeners = this.list.get(resolver)!

    listeners[hash] ??= new Set()

    if (!listeners[hash]) {
      listeners[hash] = new Set()
    }

    yield* callbackToIter<Unbox<Result>>(({ next }) => {
      const listener = (data: Unbox<Result>) => {
        next(data)
      }

      listeners[hash].add(listener)

      return () => {
        listeners[hash].delete(listener)
      }
    })
  }

  async *subscribeStream<Params extends any[], Result>(
    structure: ReturnType<Resolver<Result, Params>>,
  ): CancellableAsyncGenerator<Unbox<Result>> {
    const { resolver, params } = structure

    const hash = config.getResolverHash(structure)

    if (!this.streams.has(resolver)) {
      this.streams.set(resolver, {})
    }
    // biome-ignore lint/style/noNonNullAssertion: set already
    const streams = this.streams.get(resolver)!

    if (!streams[hash]) {
      streams[hash] = this.runGenerator(structure)
    }

    yield* this.subscribeGeneral(structure)
  }

  /**
   * Subscribe on resolvers invalidation
   */
  async *subscribe<Params extends any[], Result>(
    structure: ReturnType<Resolver<Result, Params>>,
  ): CancellableAsyncGenerator<Unbox<Result>> {
    yield resolve(structure)

    yield* this.subscribeGeneral(structure)
  }

  emit<Params extends any[], Result>(
    structure: ReturnType<Resolver<Result, Params>>,
    dataPromise: Promise<Unbox<Result>>,
  ) {
    const { resolver, params } = structure

    if (!this.list.has(resolver)) return

    const hash = config.getResolverHash(structure)

    this.list
      .get(resolver)!
      [hash]?.forEach((listner: any) => listner(dataPromise))
  }

  async invalidate<Params extends any[], Result>(
    structure: ReturnType<Resolver<Result, Params>>,
  ): Promise<Result> {
    const result = resolve(structure)

    this.emit(structure, result)

    // TODO(@lttb): fix typings
    return result as any
  }
}

const ee = new EventEmitter()

export const subscribeStream: typeof ee.subscribeStream = (structure) =>
  ee.subscribeStream(getStructure(structure))

export const subscribe: typeof ee.subscribe = (structure) =>
  ee.subscribe(getStructure(structure))

export const invalidate: typeof ee.invalidate = (structure, force = true) =>
  ee.invalidate(getStructure(structure))
