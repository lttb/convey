import { createResolverHandler } from '@convey/core/server/bun'

import * as resolvers from './resolvers/server'

const handleResolver = createResolverHandler(resolvers)

const getResponse = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response()
  }

  const url = new URL(req.url)

  if (url.pathname.startsWith('/api/resolvers')) {
    return handleResolver(req)
  }

  return new Response('404')
}

Bun.serve({
  async fetch(req) {
    const res = await getResponse(req)

    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS',
    )
    res.headers.set(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    )

    return res
  },
})
