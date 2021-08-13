import {createResolver, createResolverStream} from '@convey/core';
import {exec} from 'child_process';
import {promisify} from 'util';

import {wait} from '../../utils';

export const getServerDate = createResolverStream(async function* () {
    while (true) {
        yield (await promisify(exec)('date')).stdout.toString();
        await wait(1000);
    }
});

export const getHello = createResolver(
    async function (name: string) {
        throw new Error('PROBLEM')

        const date = (await promisify(exec)('date')).stdout.toString();

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
