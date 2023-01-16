import type {Resolver, ResolverOptions} from '../types';
import {resolve, resolveStream} from '.';

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
                    res(await resolve(structure as any));
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
                    return _promise.then(onRes, onRej);
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

            return structure;
        },
        {options}
    );

const structures = new WeakMap();
export const getStructure = (p) => (p?.resolver ? p : structures.get(p));

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
