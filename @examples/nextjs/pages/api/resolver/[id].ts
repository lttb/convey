import { createResolverHandler } from '@convey/core/server'

import * as resolvers from '../../../resolvers/server'

const handleResolver = createResolverHandler(resolvers)

export default async function handle(req, res) {
	await handleResolver(req, res)
}
