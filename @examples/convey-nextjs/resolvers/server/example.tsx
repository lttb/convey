import {createResolver, createResolverStream} from '@convey/core';
import {ExampleEntity} from '@examples/convey-nextjs/entities';
import {exec} from 'child_process';
import {promisify} from 'util';

import {wait} from '../../utils';

const getDate = () => promisify(exec)('date').then((x) => x.stdout.toString());

export const getServerDate = createResolverStream(async function* () {
    while (true) {
        yield await getDate();
        await wait(1000);
    }
});

export const getHello = createResolver(
    async function (name: string) {
        const date = await getDate();

        return `Hello, ${name} / ${date}`;
    },
    {
        cacheable: {
            remote: {
                ttl: 5000,
                level: 'localStorage',
            },
        },
    }
);

export const getExample = createResolver(async function () {
    return new ExampleEntity({id: 1, name: 'test'});
});

export const getExampleString = createResolver(async function (
    value: ExampleEntity
) {
    return `${value.id}:${value.name}`;
});
