import { createServer } from 'node:http'

import { createResolverHandler } from '@convey/core/server/node'

import * as resolvers from './resolvers/server'

const handleResolver = createResolverHandler(resolvers)

const server = createServer(async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET')
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization',
	)

	if (req.method === 'OPTIONS' || !req.url) {
		res.writeHead(204)
		res.end()
		return
	}

	const url = new URL(req.url, 'http://localhost')

	// stream init seems a bit slow?
	if (url.pathname.startsWith('/api/resolvers')) {
		return handleResolver(req, res)
	}
})

server.listen(3000)
