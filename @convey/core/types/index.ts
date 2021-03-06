export type UnboxPromise<T> = T extends Promise<infer U> ? U : T;

export type UnboxGenerator<T> = T extends AsyncGenerator<infer G>
    ? G
    : T extends Generator<infer G>
    ? G
    : T;

export type Unbox<T> = UnboxPromise<UnboxGenerator<T>>;

export type ResolverStructure<
    Params extends any[],
    Result,
    Options extends ResolverOptions = ResolverOptions,
    Context = any
> = {
    resolver: (...params: Params) => Result;
    /**
     * Context usage is under the draft at the moment
     */
    context: Context;
    params: Params;
    options: Options;
};

type CacheOptions<CL> = {
    /**
     * Cache Time to Live, ms
     */
    ttl: number;
    /**
     * @experimental Set Cache Level
     */
    level?: CL;
};
export type Cacheable =
    | boolean
    | CacheOptions<'default'>
    | {
          local?: CacheOptions<'default'>;
          remote?: CacheOptions<
              'default' | 'transport' | 'localStorage' | 'sessionStorage'
          >;
      };

export type ResolverOptions = {
    cacheable?: Cacheable;
    id?: string;
    /**
     * Experimental custom resolver hashing
     * TODO: improve typing
     */
    getHash?: (structure: ResolverStructure<any, any>) => string;
};

interface ResolverFunction<
    Params extends any[],
    Result,
    Options extends ResolverOptions = ResolverOptions,
    Context = any
> {
    // TODO: think about this type
    (...params: Params): {
        resolver: (...params: Params) => Result;
        /**
         * Context usage is under the draft at the moment
         */
        context: Context;
        params: Params;
        options: Options;

        stream: boolean;
    };
    options: Options;
}

export type Resolver<
    Params extends any[],
    Result,
    Options extends ResolverOptions = ResolverOptions,
    Context = any
> = ResolverFunction<Params, Result, Options, Context>;

/**
 * If true, then terminate the stream and call others termination
 */
type Signal = void | true;

export type CancellableGenerator<T> = Generator<T, any, Signal>;
export type CancellableAsyncGenerator<T> = AsyncGenerator<T, any, Signal>;
