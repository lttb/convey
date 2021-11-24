import '@convey-example/nextjs/styles/globals.css';

import {setConfig} from '@convey/core';

import {createResolverFetcher} from '@convey/core/client';

setConfig({
    fetch: createResolverFetcher({openWhenHidden: true}),
});

function MyApp({Component, pageProps}) {
    return <Component {...pageProps} />;
}

export default MyApp;
