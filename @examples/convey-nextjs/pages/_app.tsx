import '@examples/convey-nextjs/styles/globals.css';

import {setConfig} from '@convey/core/index';
import {createResolverFetcher} from '@convey/core/client';

import '@examples/convey-nextjs/entities';

setConfig({
    fetch: createResolverFetcher({openWhenHidden: true}),
});

function MyApp({Component, pageProps}) {
    return <Component {...pageProps} />;
}

export default MyApp;
