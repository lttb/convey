import express from 'express'
import cors from 'cors'

import * as resolvers from './resolvers/server'
import { createResolverHandler } from '@convey/core/server'

const port = 3000

const app = express()

const handleResolver = createResolverHandler(resolvers)

app.use(cors())
app.use(express.json())

app.all('/api/resolvers/:id', async (req, res, next) => {
	console.log('body', req.body)

	await handleResolver(req, res)
})

// Start http server
app.listen(port, () => {
	console.log(`Server started at http://localhost:${port}`)
})
