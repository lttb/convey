import type { Resolver, ResolverOptions, ResolverResult } from '../types'
import { resolve, resolveStream } from '.'

type PromiseOrGeneratorResolver<Result, Params extends any[], Context> = (
  this: Context,
  ...params: Params
) => Result | AsyncGenerator<Result> | Generator<Result>

const createBaseResolver = <
  Result,
  Params extends any[],
  Options extends ResolverOptions,
  Context,
>({
  options,
  resolver,
  stream = false,
}: {
  options: Options
  resolver: PromiseOrGeneratorResolver<Result, Params, Context>
  stream?: boolean
}): Resolver<Result, Params, Options, Context> =>
  // @ts-expect-error
  Object.assign(
    function (this: Context, ...params: Params) {
      const executor = async (res: any, rej: any) => {
        try {
          res(await resolve(structure as any))
        } catch (error) {
          rej(error)
        }
      }
      let _promise: Promise<any>
      let _iter: ReturnType<typeof resolveStream>
      const structure = {
        /** detect if there is any special context */
        context: this === defaultThis ? null : this,
        resolver,
        params,
        options,
        stream,
        // biome-ignore lint/suspicious/noThenProperty:
        then(onRes: any, onRej: any) {
          _promise = _promise || new Promise(executor)
          return _promise.then(onRes, onRej)
        },
        catch(onRej: any) {
          _promise = _promise || new Promise(executor)
          return _promise.catch(onRej)
        },
        finally(onFin: any) {
          _promise = _promise || new Promise(executor)
          return _promise.finally(onFin)
        },
        async *[Symbol.asyncIterator]() {
          _iter = _iter || resolveStream(structure as any)

          for await (const value of _iter) {
            yield value
          }
        },
      }

      return structure
    },
    { options },
  )

const structures = new WeakMap<ResolverResult<any, any>>()
export const getStructure = (p: any) => (p?.resolver ? p : structures.get(p))

/** isomorphic global this alternative */
const defaultThis = (function (this: any) {
  return this
})()

export const createResolver = <
  Params extends any[],
  Result,
  Options extends ResolverOptions,
  Context,
>(
  resolver: (this: Context, ...params: Params) => Result,
  options?: Options,
): Resolver<Result, Params, Options, Context> =>
  createBaseResolver({
    resolver,
    options: Object.assign({ cacheable: true }, options),
  })

export const createResolverStream = <
  Params extends any[],
  Result,
  Options extends ResolverOptions,
  Context,
>(
  resolver: (
    this: Context,
    ...params: Params
  ) => AsyncGenerator<Result> | Generator<Result>,
  options?: Options,
): Resolver<Result, Params, Options, Context> =>
  createBaseResolver({
    resolver,
    options: Object.assign({ cacheable: true }, options),

    stream: true,
  })
