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
    const depMap = dependencyMap.get(structure.resolver)?.get(hash);

    if (!depMap) return [];

    return [...depMap.values()].flatMap((x) => Object.values(x));
}

export function addDep(structure, dep) {
    if (!dep || structure.resolver === dep.resolver) return;

    structure.prev = current;

    console.log('addDep', structure.options.id, structure.params, current?.options.id);


    if (!dependencyMap.has(structure.resolver)) {
        dependencyMap.set(structure.resolver, new Map());
    }

    const deps = dependencyMap.get(structure.resolver);

    const hash = config.getResolverHash(structure);

    if (!deps.has(hash)) {
        deps.set(hash, new Map());
    }

    const depMap = deps.get(hash);

    if (!depMap.has(dep.resolver)) {
        depMap.set(dep.resolver, {});
    }

    const depHash = config.getResolverHash(dep);

    depMap.get(dep.resolver)[depHash] = dep;

    console.log(dependencyMap)
}

export function removeDep(structure, dep) {
    if (!dep || structure.resolver === dep.resolver) return;

    const hash = config.getResolverHash(structure);

    const deps = dependencyMap.get(structure.resolver);

    if (!deps || !deps.has(hash)) return;

    const depHash = config.getResolverHash(dep);

    delete deps.get(hash)[depHash];
}

export function regDep(structure) {

    addDep(structure, current);

}

export function execResolver(structure) {
    const {resolver, context, params} = structure;

    const result = context
        ? resolver.apply(context, params)
        : resolver(...params);

    return result;
}
export const setBack = (structure, source) => {
    current = structure.prev;
    console.log('set back', source, structure.options.id, current?.options.id);
};

export async function fetchResolver(structure) {
    const {resolver, options} = structure;

    if (typeof resolver === 'function') {
        try {
            const result = await execResolver(structure);

            if (!structure.stream) {
                return {
                    type: 'local',
                    options,
                    payload: result,
                };
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
    current = structure;

    console.log('current', structure.options.id);

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


    setBack(structure, 'sync')

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
