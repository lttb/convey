import '@examples/nextjs/styles/globals.css'

import {createResolverFetcher} from '@convey/core/client'
import {setConfig} from '@convey/core/index'
import type {AppProps} from 'next/app'

import '@examples/nextjs/entities'

setConfig({
  fetch: createResolverFetcher({openWhenHidden: true}),
})

function MyApp({Component, pageProps}: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
