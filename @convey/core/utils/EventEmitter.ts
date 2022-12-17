import {config} from '../config';
import {callbackToIter, terminateStream} from './callbackToIter';
import {getDeps, removeDep, resolve, resolveStream} from './resolvers';

import type {Resolver, CancellableAsyncGenerator, Unbox} from '../types';

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

    invalidate<Params extends any[], Result>(
        structure: ReturnType<Resolver<Result, Params>>
    ): void {
        removeDep(structure, structure.prev)
        structure.prev = null

        this.emit(structure, resolve(structure));

        const deps = getDeps(structure);

        console.log('invalidate', structure, deps);

        deps.forEach((dep) => {
            this.invalidate(dep);
        });
    }
}

const ee = new EventEmitter();

export const subscribeStream: typeof ee.subscribeStream = (structure) =>
    ee.subscribeStream(structure);

export const subscribe: typeof ee.subscribe = (structure) =>
    ee.subscribe(structure);

export const invalidate: typeof ee.invalidate = (structure) =>
    ee.invalidate(structure);
