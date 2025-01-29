import '@examples/nextjs/styles/globals.css'

import type { AppProps } from 'next/app'

import '@examples/nextjs/entities'

function MyApp({ Component, pageProps }: AppProps) {
	return <Component {...pageProps} />
}

export default MyApp
