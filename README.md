# convey

-   [@convey/core](@convey/core)
-   [@convey/babel-plugin](@convey/babel-plugin)
-   [@convey/react](@convey/react)

> This project is still at an early stage and is not production ready. API could be changed.

## Key Features

- Seameless code usage between client and server – call server functions just as normal functions (and vice-versa 😉).
- Out of the box streaming support (with Server Sent Events by default)
- Framework agnostic
- Strong Typescript support
- Advanced resolver caching options: from HTTP-level to session storage
- Performant React component subscriptions, and automatic cache invalidation rerendering

## Examples

-   [nextjs](examples/convey-nextjs)

[![codesandbox example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/upbeat-tess-zxk1e?file=/pages/index.tsx)

## Quick Start

Install dependencies:

```sh
npm install --save @convey/core
npm install --save-dev @convey/babel-plugin
```

Optional for usage with `react`:

```sh
npm install --save @convey/react
```

### Babel config

> See [nextjs babel.config.js](examples/convey-nextjs/babel.config.js) for example

Add `@convey/babel-plugin` to your babel config:

```js
// babel.config.js

module.exports = {
    plugins: [
        [
            '@convey',
            {
                /**
                 * Determine "remote" resolvers
                 *
                 * "server" resolvers will be processed as remote for the "client" code, and vice versa
                 */
                remote:
                    process.env.TARGET === 'client'
                        ? /resolvers\/server/
                        : /resolvers\/client/,
            },
        ],
    ],
};
```

### Server handler config

> See [nextjs pages/api/resolver/[id].ts](examples/convey-nextjs/pages/api/resolver/[id].ts) for example

```ts
import {createResolverHandler} from '@convey/core/server';

import * as resolvers from '@app/resolvers/server';

const handleResolver = createResolverHandler(resolvers);

export default async function handle(req, res) {
    await handleResolver(req, res);
}
```

### Client config

> See [nextjs pages/\_app.tsx](examples/convey-nextjs/pages/_app.tsx) for example

```ts
import {setConfig} from '@convey/core';
import {createResolverFetcher} from '@convey/core/client';

setConfig({
    fetch: createResolverFetcher(),
});
```

### Declare and use resolvers

#### Server resolver

_resolvers/server/index.tsx_

```ts
import { exec } from "child_process";
import { promisify } from "util";

import {createResolver, createResolverStream} from '@convey/core';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * This code will be executed on the server side
 */
export const getServerDate = createResolver(async () =>
    promisify(exec)("date").then((x) => x.stdout.toString())
);

export const getServerHello = createResolver(
    (name: string) => `Hello, ${name}`
);

/**
 * It is also possible to declare the stream via generator function.
 * By default, the data will be streamed by SSE (Server Sent Events)
 */
export const getServerHelloStream = createResolverStream(async function* (
    name: string
) {
    while (true) {
        /**
         * Resolvers could be called as normal functions on server side too
         */
        yield await getServerHello(`${name}-${await getServerDate()}`);
        await wait(1000);
    }
});
```

After processing, on the client-side the actual code will be like:

```js
import { createResolver, createResolverStream } from '@convey/core';

/**
 * This code will be executed on the server side
 */
 
export const getServerDate = createResolver({}, {
  id: "3296945930:getServerDate"
}); 
 
export const getServerHello = createResolver({}, {
  id: "3296945930:getServerHello"
});

/**
 * It is also possible to declare the stream via generator function.
 * By default, the data will be streamed by SSE (Server Sent Events)
 */
export const getServerHelloStream = createResolverStream({}, {
  id: "3296945930:getServerHelloStream"
});
```


#### Client resolver usage

Direct usage:

```ts
import {getServerHello, getServerHelloStream} from '@app/resolvers/server';

console.log(await getServerHello('world')); // `Hello, world`

for await (let hello of getServerHelloStream('world')) {
    console.log(hello); // `Hello, world-1637759100546` every second
}
```

Usage with React:

```tsx
import {useResolver} from '@convey/react';
import {getServerHello, getServerHelloStream} from '@app/resolvers/server';

export const HelloComponent = () => {
    /**
     * Component will be automatically rerendered on data invalidation
     */
    const [hello] = useResolver(getServerHello('world'));
    /**
     * If resolver is a stream, then component will be rerendered
     * on each new chunk of data
     */
    const [helloStream] = useResolver(getServerHelloStream('world'));

    return (
        <div>
            <p>Single hello: {hello}</p>
            <p>Stream hello: {helloStream}</p>
        </div>
    );
};
```

## Thanks

This project was heavily inspired by work of amazing engineers at Yandex.Market:

-   [@loyd](https://github.com/loyd)
-   [@pavelrevers](https://github.com/pavelrevers)
