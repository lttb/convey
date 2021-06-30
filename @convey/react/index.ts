import {useState, useEffect, createElement} from 'react';

import {subscribeStream, subscribe, resolveStream, config} from '@convey/core';

import type {Resolver, Unbox} from '@convey/core';

type MetaBase = {refresh: () => void};

type Meta = MetaBase &
    ({status: 'PENDING' | 'UNSET' | 'DONE'} | {status: 'ERROR'; error: Error});

type HookResult<Result> =
    | [Unbox<Result>, MetaBase & {status: 'DONE'}]
    | [
          null,
          MetaBase &
              ({status: 'PENDING' | 'UNSET'} | {status: 'ERROR'; error: Error})
      ];

export function useResolver<Params extends any[], Result>(
    resolver: ReturnType<Resolver<Params, Result>>
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
    }, [resolver, config.getResolverHash(structure), counter]);

    return [data, meta] as any;
}

export async function serialize(element) {
    if (!element?.type) return element;

    let result = {type: element.type, props: {...element.props}};

    if (typeof element.key === 'function') {
        return serialize(await element.key(element.props));
    }

    if (result.props.children) {
        result.props.children = await Promise.all(
            []
                .concat(element.props?.children ?? [])
                .map((child) => serialize(child))
        );
    }

    return result;
}

export function deserialize(element) {
    if (!element?.type) return element;

    let result = {type: element.type, props: {...element.props}};

    if (result.props.children) {
        result.props.children = []
            .concat(element.props?.children ?? [])
            .map((child) => deserialize(child));
    }

    return createElement(result.type, result.props);
}

function useValue(v) {
    const [state, setState] = useState(null);
    useEffect(() => {
        if (typeof v === 'function') {
            v().then(setState);
        } else {
            setState(v);
        }
    }, []);
    return state;
}
export function ServerComponent({value}) {
    const result = useValue(value);
    const [element] = useResolver(result);

    return deserialize(element) || null;
}
