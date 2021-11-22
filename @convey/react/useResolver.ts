import {useState, useEffect} from 'react';

import {subscribeStream, subscribe, resolveStream, config} from '@convey/core';

import type {Resolver, Unbox} from '@convey/core';

type MetaBase = {refresh: () => void};

type Meta = MetaBase &
    ({status: 'PENDING' | 'UNSET' | 'DONE'} | {status: 'ERROR'; error: Error});

type HookResult<Result> =
    | [Unbox<Result>, MetaBase & {status: 'DONE'}]
    | [
          undefined,
          MetaBase &
              ({status: 'PENDING' | 'UNSET'} | {status: 'ERROR'; error: Error})
      ];

export function useResolver<Params extends any[], Result>(
    resolver: null | ReturnType<Resolver<Params, Result>>
): HookResult<Result>;

export function useResolver(structure) {
    const {resolver} = structure ?? {};

    const [counter, setCounter] = useState(0);
    const [meta, setMeta] = useState<Meta>({
        status: 'UNSET',
        refresh: () => setCounter((x) => x + 1),
    });
    const [data, setData] = useState(undefined);

    useEffect(() => {
        if (!resolver) return;

        let iter;
        let finished = false;

        async function main() {
            setMeta((meta) => ({...meta, status: 'PENDING'}));

            if (structure.stream) {
                if (typeof resolver === 'function') {
                    iter = resolveStream(structure);
                } else {
                    iter = subscribeStream(structure);
                }
            } else {
                iter = subscribe(structure);
            }

            try {
                for await (let value of iter) {
                    if (finished) return;

                    setData(() => value);
                    setMeta((meta) => ({...meta, status: 'DONE'}));
                }
            } catch (error) {
                console.error({error, iter, structure});
                setMeta((meta) => ({...meta, status: 'ERROR', error}));
            }
        }

        main();

        return () => {
            finished = true;

            iter.return();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolver, config.getResolverHash(structure), counter]);

    return [data, meta] as any;
}
