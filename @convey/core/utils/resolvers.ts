import 'core-js/actual/set-immediate';

import {config} from '../config';

import {LocalCache} from './LocalCache';

import type {ResolverResult, Unbox} from '../types';

export {getCacheOptions} from './LocalCache';

let current = null;
const contextMap = new WeakMap();

const dependencyMap = new Map();

export function getCurrentContext() {
    return contextMap.get(current);
}

export function getDeps(structure) {
    const hash = config.getResolverHash(structure);

    return Object.values(
        dependencyMap.get(structure.resolver)?.get(hash) || {}
    );
}

export function addDep(structure, dep) {
    if (!dep || structure.resolver === dep.resolver) return;

    const hash = config.getResolverHash(structure);

    if (!dependencyMap.has(structure.resolver)) {
        dependencyMap.set(structure.resolver, new Map());
    }

    const deps = dependencyMap.get(structure.resolver);

    if (!deps.has(hash)) {
        deps.set(hash, {});
    }

    const depHash = config.getResolverHash(dep);

    deps.get(hash)[depHash] = dep;
}

export function regDep(structure) {
    structure.prev = current;

    addDep(structure, current);
}

export function execResolver(structure) {
    const {resolver, context, params} = structure;

    current = structure;

    const result = context
        ? resolver.apply(context, params)
        : resolver(...params);

    current = structure.prev;

    if (result instanceof Promise) {
        result?.then(() => {
            current = structure.prev;
        });
    }

    return result;
}

export async function fetchResolver(structure) {
    const {resolver, options} = structure;

    if (typeof resolver === 'function') {
        try {
            const result = await execResolver(structure);

            if (!structure.stream) {
                return {type: 'local', options, payload: result};
            }

            let {value} = await result.next();

            result.return(undefined);

            return {type: 'local', options, payload: value};
        } catch (error) {
            return {type: 'local', options, error: true, payload: error};
        }
    }

    for await (const value of config.fetch!(structure)) {
        const {payload, options, error} = value.data;

        return {type: 'remote', options, payload, error};
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

export async function resolve<Result, Params extends any[]>(
    structure: ResolverResult<Result, Params>
): Promise<Unbox<Result>>;

export async function resolve(structure) {
    localCache = localCache || new LocalCache();

    if (!localCache.has(structure)) {
        localCache.set(structure, fetchResolver(structure) as any);
    }

    const result = localCache.get(structure);

    const r = result?.then
        ? result.then((data) => {
              if (data && data.error) {
                  throw data.payload;
              }

              return data;
          })
        : result;

    return r;
}

export async function* resolveStream<Result, Params extends any[]>(
    structure: ResolverResult<Result, Params>
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
