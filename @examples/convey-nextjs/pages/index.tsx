import {createResolver, createResolverStream, invalidate} from '@convey/core';
import {useResolver} from '@convey/react';

import {
    getServerDate,
    getHello,
    getExample,
    getExampleString,
} from '../resolvers/server/example';

export default function Simple() {
    const [hello] = useResolver(getHello('world'));
    const [serverDate] = useResolver(getServerDate());

    return (
        <div>
            <p>Server date: {serverDate}</p>
            <p>Greeting: {hello}</p>
        </div>
    );
}
