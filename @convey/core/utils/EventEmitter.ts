import {config} from '../config';
import {callbackToIter, terminateStream} from './callbackToIter';
import {resolve, resolveStream} from './resolvers';

import type {Resolver, CancellableAsyncGenerator, Unbox} from '../types';
import {
    createResolver,
    getCurrentContext,
    getDeps,
    getParentContext,
    getStructure,
} from './createResolver';

const UNCACHED_VALUE = Symbol('uncached');

export class Uncacheable<T = any> {
    x = Date.now() + Math.random();
    [UNCACHED_VALUE]: T;

    constructor(value: T) {
        this[UNCACHED_VALUE] = value;
    }

    valueOf(): T {
        return this[UNCACHED_VALUE];
    }
}

const VISITED = Symbol('visited');

export class EventEmitter {
    list: Map<any, Record<string, any>>;
    streams: Map<any, Record<string, any>>;

    constructor() {
        this.list = new Map();
        this.streams = new Map();
    }

    private async runGenerator(structure) {
        for await (let value of resolveStream(structure)) {
            // @ts-expect-error TODO: fix
            this.emit(structure, value);
        }
    }

    private async *subscribeGeneral<Params extends any[], Result>(
        structure: ReturnType<Resolver<Result, Params>>
    ): CancellableAsyncGenerator<Unbox<Result>> {
        const {resolver, params} = structure;

        const hash = config.getResolverHash(structure);

        if (!this.list.has(resolver)) {
            this.list.set(resolver, {});
        }
        const listeners = this.list.get(resolver);
        if (!listeners[hash]) {
            listeners[hash] = new Set();
        }

        yield* callbackToIter<Unbox<Result>>(({next}) => {
            const listener = (data) => {
                next(data);
            };

            listeners[hash].add(listener);

            return () => {
                listeners[hash].delete(listener);
            };
        });
    }

    async *subscribeStream<Params extends any[], Result>(
        structure: ReturnType<Resolver<Result, Params>>
    ): CancellableAsyncGenerator<Unbox<Result>> {
        const {resolver, params} = structure;

        const hash = config.getResolverHash(structure);

        if (!this.streams.has(resolver)) {
            this.streams.set(resolver, {});
        }
        const streams = this.streams.get(resolver);
        if (!streams[hash]) {
            streams[hash] = this.runGenerator(structure);
        }

        yield* this.subscribeGeneral(structure);
    }

    /**
     * Subscribe on resolvers invalidation
     */
    async *subscribe<Params extends any[], Result>(
        structure: ReturnType<Resolver<Result, Params>>
    ): CancellableAsyncGenerator<Unbox<Result>> {
        yield resolve(structure);

        yield* this.subscribeGeneral(structure);
    }

    emit<Params extends any[], Result>(
        structure: ReturnType<Resolver<Result, Params>>,
        dataPromise: Promise<Unbox<Result>>
    ) {
        const {resolver, params} = structure;

        if (!this.list.has(resolver)) return;

        const hash = config.getResolverHash(structure);

        this.list
            .get(resolver)
            [hash]?.forEach((listner) => listner(dataPromise));
    }

    async invalidate<Params extends any[], Result>(
        structure: ReturnType<Resolver<Result, Params>>,
        force = false,
        _visited = new Set()
    ): Promise<Result> {
        const ctx = getParentContext();
        const currentContext = getCurrentContext();

        const visited = (ctx || {})[VISITED] || _visited;
        if (currentContext) currentContext[VISITED] = visited;

        const hash = config.getResolverHash(structure);

        if (visited.has(hash)) return;

        visited.add(hash);

        const result = resolve(structure, force);
        this.emit(structure, result);

        const deps = getDeps(structure);

        deps.forEach((dep) => {
            this.invalidate(dep as any, true, visited);
        });
        // // TODO: fix types
        return result as any;
    }
}

const ee = new EventEmitter();

export const subscribeStream: typeof ee.subscribeStream = (structure) =>
    ee.subscribeStream(getStructure(structure));

export const subscribe: typeof ee.subscribe = (structure) =>
    ee.subscribe(getStructure(structure));

export const invalidate: typeof ee.invalidate = (structure, force = true) =>
    ee.invalidate(getStructure(structure), force);
