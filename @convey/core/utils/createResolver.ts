import type {Resolver, ResolverOptions} from '../types';
import {resolve} from '.';
import {config} from '../config';

let ref = {current: null};
let contexts = new WeakMap();

export const getParentContext = () => contexts.get(ref.current);
export const getCurrentContext = () => ref.current;

const dependencyMap = new Map();

export function getDeps(structure) {
    const hash = config.getResolverHash(structure);
    const depMap = dependencyMap.get(structure.resolver)?.get(hash);

    if (!depMap) return [];

    return [...depMap.values()].flatMap((x) => Object.values(x));
}

export function addDep(structure, dep) {
    if (!dep || structure.resolver === dep.resolver) return;

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
}

const createBaseResolver = <
    Params extends any[],
    Options extends ResolverOptions,
    Context
>({
    options,
    resolver,
    stream = false,
}) => {
    let current_str = null;

    async function fn(this: Context, ...params: Params) {
        const structure = {
            /** detect if there is any special context */
            context: this === defaultThis ? null : this,
            resolver,
            params,
            options,
            stream,
        };

        current_str = structure;

        const prev = ref.current;
        ref.current = structure;

        contexts.set(ref.current, prev);
        addDep(ref.current, prev);

        const result = resolve(structure as any);

        ref.current = prev;

        const res = await result;

        queueMicrotask(() => {
            ref.current = prev;
        });

        return res;
    }

    return Object.assign(
        function (...args) {
            current_str = null;
            const p = fn.apply(this, args as any);
            Object.assign(p, current_str);
            structures.set(p, current_str);

            return p;
        },
        {options}
    );
};

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
