export type UnboxPromise<T> = T extends Promise<infer U> ? U : T

export type UnboxGenerator<T> = T extends AsyncGenerator<infer G>
    ? G
    : T extends Generator<infer G>
    ? G
    : T

export type Unbox<T> = UnboxPromise<UnboxGenerator<T>>

export type ResolverStructure<
    Result,
    Params extends any[],
    Options extends ResolverOptions = ResolverOptions,
    Context = any,
> = {
    resolver: (...params: Params) => Result
    /**
     * Context usage is under the draft at the moment
     */
    context: Context
    params: Params
    options: Options
}

type CacheOptions<CL> = {
    /**
     * Cache Time to Live, ms
     */
    ttl: number
    /**
     * @experimental Set Cache Level
     */
    level?: CL
}
export type Cacheable =
    | boolean
    | CacheOptions<'default'>
    | {
          local?: CacheOptions<'default'>
          remote?: CacheOptions<
              'default' | 'transport' | 'localStorage' | 'sessionStorage'
          >
      }

export type ResolverOptions = {
    cacheable?: Cacheable
    id?: string
    /**
     * Experimental custom resolver hashing
     * TODO: improve typing
     */
    getHash?: (structure: ResolverStructure<any, any>) => string
}

export type ResolverResult<
    Result,
    Params extends any[] = any[],
    Options extends ResolverOptions = ResolverOptions,
    Context = any,
> = {
    resolver: (this: Context, ...params: Params) => Result
    /**
     * Context usage is under the draft at the moment
     */
    context: Context
    params: Params
    options: Options

    stream: boolean
} & Promise<Result> &
    AsyncIterable<Result>

interface ResolverFunction<
    Result,
    Params extends any[] = any[],
    Options extends ResolverOptions = ResolverOptions,
    Context extends any = any,
> {
    (this: Context, ...params: Params): ResolverResult<
        Result,
        Params,
        Options,
        Context
    >
    options: Options
}

export type Resolver<
    Result,
    Params extends any[] = any[],
    Options extends ResolverOptions = ResolverOptions,
    Context extends any = any,
> = ResolverFunction<Result, Params, Options, Context>

/**
 * If true, then terminate the stream and call others termination
 */
type Signal = void | true

export type CancellableGenerator<T> = Generator<T, any, Signal>
export type CancellableAsyncGenerator<T> = AsyncGenerator<T, any, Signal>
