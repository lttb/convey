import {invalidate, subscribe, subscribeStream} from './utils/EventEmitter';

import type {Resolver, ResolverOptions} from './types';

// TODO: exclude "createResolverFetcher" from the main bundle
import {createResolverFetcher} from './client';
import {getResolverHash, resolve, resolveStream} from './utils';
import {setConfig} from './config';
import {regDep, setBack} from './utils/resolvers';

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
}) =>
    Object.assign(
        function (this: Context, ...params: Params) {
            const executor = async (res, rej) => {
                try {
                    const result = await resolve(structure as any);
                    res(result);
                    queueMicrotask(() => {
                        setBack(structure, 'resolve');
                    });
                } catch (error) {
                    rej(error);
                }
            };
            let _promise;
            let _iter;
            const structure = {
                /** detect if there is any special context */
                context: this === defaultThis ? null : this,
                resolver,
                params,
                options,
                stream,
                then(onRes, onRej) {
                    _promise = _promise || new Promise(executor);
                    console.log('then', structure.options.id);
                    return _promise.then((res) => {
                        console.log(
                            'result',
                            structure.options.id,
                            structure.prev?.options.id
                        );

                        onRes(res);
                    }, onRej);
                },
                catch(onRej) {
                    _promise = _promise || new Promise(executor);
                    return _promise.catch(onRej);
                },
                finally(onFin) {
                    _promise = _promise || new Promise(executor);
                    return _promise.finally(onFin);
                },
                async *[Symbol.asyncIterator]() {
                    _iter = _iter || resolveStream(structure as any);

                    for await (const value of _iter) {
                        yield value;
                    }
                },
            };

            regDep(structure);

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
): Resolver<Result, Params, Options, Context> =>
    createBaseResolver({
        resolver,
        options: Object.assign({cacheable: true}, options),
    }) as any;

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
): Resolver<Result, Params, Options, Context> =>
    createBaseResolver({
        resolver,
        options: Object.assign({cacheable: true}, options),

        stream: true,
    }) as any;

export {invalidate, subscribe, subscribeStream};
