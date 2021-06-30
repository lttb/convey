import {invalidate, subscribe, subscribeStream} from './utils/EventEmitter';

import type {Resolver, ResolverOptions} from './types';

// TODO: exclude "createResolverFetcher" from the main bundle
import {createResolverFetcher} from './client';
import {getResolverHash} from './utils';
import {setConfig} from './config';

export * from './config';
export * from './utils';
export * from './types';

setConfig({
    fetch: createResolverFetcher(),
    getResolverHash,
});

export function buildResolverMap<R extends Resolver<any, any, any>>(
    resolvers: Record<string, R>
) {
    return Object.values(resolvers).reduce((acc, resolver) => {
        acc[resolver.options.id] = resolver;
        return acc;
    }, {});
}

const createBaseResolver = <
    Params extends any[],
    Options extends ResolverOptions,
    Context
>({
    options,
    resolver,
    stream = false,
}: {
    options: Options;
    resolver: any;
    stream?: boolean;
}) =>
    Object.assign(
        function (this: Context, ...params: Params) {
            const structure = {
                /** detect if there is any special context */
                context: this === defaultThis ? null : this,
                resolver,
                params,
                options,
                stream,
            };

            return structure;
        },
        {options}
    );

/** isomorphic global this alternative */
const defaultThis = (function () {
    return this;
})();

export const createResolver = <
    Params extends any[],
    Result,
    Options extends ResolverOptions,
    Context
>(
    resolver: (this: Context, ...params: Params) => Result,
    options?: Options
): Resolver<Params, Result, Options, Context> =>
    createBaseResolver({
        resolver,
        options: Object.assign({cacheable: true}, options),
    });

export const createResolverStream = <
    Params extends any[],
    Result,
    Options extends ResolverOptions,
    Context
>(
    resolver: (
        this: Context,
        ...params: Params
    ) => AsyncGenerator<Result> | Generator<Result>,
    options?: Options
): Resolver<Params, Result, Options, Context> =>
    createBaseResolver({
        resolver,
        options: Object.assign({cacheable: true}, options),

        stream: true,
    });

export {invalidate, subscribe, subscribeStream};
