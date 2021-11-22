import {buildResolverMap} from '@convey/core';
import {handleResolver} from '@convey/core/server';

import * as resolvers from '../../../resolvers/server';

const resolversMap = buildResolverMap(resolvers);

export default async function handle(req, res) {
    const {query} = req;

    const id = query.id;
    const {params} = query.b ? JSON.parse(query.b) : req.body;

    try {
        // TODO: handle wrong resolver id
        const structure = resolversMap[id as string].apply({}, params);

        await handleResolver(req, res, structure);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}
