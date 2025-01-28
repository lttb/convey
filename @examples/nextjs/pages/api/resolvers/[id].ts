import type { NextApiRequest, NextApiResponse } from 'next'

import { createResolverHandler } from '@convey/core/server'

import * as resolvers from '@examples/nextjs/resolvers/server'

const handleResolver = createResolverHandler(resolvers)

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	await handleResolver(req, res)
}
