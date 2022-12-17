import {createResolver, createResolverStream, invalidate} from '@convey/core';
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

const db = {name: 'John'};

export const getUserName = createResolver(async function () {
    return db.name;
});

export const setUserName = createResolver(async function (name: string) {
    db.name = name;

    invalidate(getUserName());
});