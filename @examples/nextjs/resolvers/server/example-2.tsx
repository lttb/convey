import {createResolver} from '@convey/core';
import * as s from 'superstruct';
import {guard} from '@examples/nextjs/utils/guard';

export const getServerGreeting = createResolver(
    guard(
        s.object({
            name: s.enums(['world', 'universe']),
            age: s.number(),
        }),
        (data) => {
            return `Hello, ${data.name}`;
        }
    )
);
