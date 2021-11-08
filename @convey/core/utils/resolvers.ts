import {config} from '../config';

import {LocalCache} from './LocalCache';

import type {Resolver, Unbox} from '../types';

export {getCacheOptions} from './LocalCache';

export function execResolver({resolver, context, params}) {
    return context ? resolver.apply(context, params) : resolver(...params);
}

export async function fetchResolver(structure) {
    const {resolver, options} = structure;

    if (typeof resolver === 'function') {
        const result = execResolver(structure);

        if (!structure.stream) {
            return {type: 'local', options, payload: result};
        }

        let {value} = await result.next();

        result.return(undefined);

        return {type: 'local', options, payload: value};
    }

    for await (const value of config.fetch!(structure)) {
        const {payload, options, error} = value.data;

        if (error) {
            throw new Error(payload.message);
        }

        return {type: 'remote', options, payload};
    }
}

export async function* fetchResolverStream(structure) {
    const {resolver, options} = structure;

    if (typeof resolver === 'function') {
        const result = execResolver(structure);

        if (!structure.stream) {
            // TODO: get rid of it, for example by separate createResolverStream
            yield {type: 'local', options, payload: result};

            return;
        }

        for await (let value of result) {
            yield {type: 'local', options, payload: value};
        }
    } else {
        for await (let value of config.fetch!(structure)) {
            if (!value?.data) continue;

            const {payload, options} = value.data;

            yield {type: 'remote', options, payload};
        }
    }
}

let localCache: LocalCache;

export async function resolve<Params extends any[], Result>(
    structure: ReturnType<Resolver<Params, Result>>
): Promise<Unbox<Result>>;

export async function resolve(structure) {
    localCache = localCache || new LocalCache();

    if (!localCache.has(structure)) {
        localCache.set(structure, fetchResolver(structure) as any);
    }

    return localCache.get(structure);
}

export async function* resolveStream<Params extends any[], Result>(
    structure: ReturnType<Resolver<Params, Result>>
): AsyncGenerator<Unbox<Result>> {
    localCache = localCache || new LocalCache();

    if (localCache.has(structure)) {
        yield localCache.get(structure);

        if (!structure.stream) {
            return;
        }
    }

    for await (let data of fetchResolverStream(structure)) {
        localCache.set(structure, data as any);

        yield data.payload;
    }
}
