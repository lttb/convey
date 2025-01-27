import fs from 'node:fs/promises'
import express from 'express'
import { Transform } from 'node:stream'

import * as resolvers from './resolvers/server/index'
import { createResolverHandler } from '@convey/core/server'

// Constants
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'
const ABORT_DELAY = 10000

// Cached production assets
const templateHtml = isProduction
	? await fs.readFile('./dist/client/index.html', 'utf-8')
	: ''

// Create http server
const app = express()

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite
if (!isProduction) {
	const { createServer } = await import('vite')
	vite = await createServer({
		server: { middlewareMode: true },
		appType: 'custom',
		base,
	})
	app.use(vite.middlewares)
} else {
	const compression = (await import('compression')).default
	const sirv = (await import('sirv')).default
	app.use(compression())
	app.use(base, sirv('./dist/client', { extensions: [] }))
}

const handleResolver = createResolverHandler(resolvers)

app.use(express.json())
app.all('/api/resolvers/:id', async (req, res, next) => {
	await handleResolver(req, res)
})

// Serve HTML
app.use('*all', async (req, res) => {
	try {
		const url = req.originalUrl.replace(base, '')

		/** @type {string} */
		let template
		/** @type {import('./src/entry-server.ts').render} */
		let render
		if (!isProduction) {
			// Always read fresh template in development
			template = await fs.readFile('./index.html', 'utf-8')
			template = await vite.transformIndexHtml(url, template)
			render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render
		} else {
			template = templateHtml
			render = (await import('./dist/server/entry-server.js')).render
		}

		const { pipe, abort } = await render(url)

		res.status(200)
		res.set({ 'Content-Type': 'text/html' })

		const transformStream = new Transform({
			transform(chunk, encoding, callback) {
				res.write(chunk, encoding)
				callback()
			},
		})

		const [htmlStart, htmlEnd] = template.split('<!--app-html-->')

		res.write(htmlStart)

		transformStream.on('finish', () => {
			res.end(htmlEnd)
		})

		pipe(transformStream)

		setTimeout(() => {
			abort()
		}, ABORT_DELAY)
	} catch (e) {
		console.log(e)

		vite?.ssrFixStacktrace(e)
		console.log(e.stack)
		res.status(500).end(e.stack)
	}
})

// Start http server
app.listen(port, () => {
	console.log(`Server started at http://localhost:${port}`)
})
