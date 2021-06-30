# convey

- [@convey/core](@convey/core)
- [@convey/babel-plugin](@convey/babel-plugin)
- [@convey/react](@convey/react)

## Examples

- [nextjs](examples/convey-nextjs)

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

Add `@convey/babel-plugin` to your babel config:

```js
// babel.config.js

module.exports = {
    plugins: [
        ['@convey', {
            /**
             * Determine "remote" resolvers
             *
             * So "server" resolvers will be processed as remote for the client code, and vice versa
             */
            remote: process.env.TARGET === 'client'
                ? /resolvers\/server/
                : /resolvers\/client/
        }]
    ]
}
```

## Thanks

This project was heavily inspired by work of amazing engineers at Yandex.Market:

- [@loyd](https://github.com/loyd)
- [@pavelrevers](https://github.com/pavelrevers)
