import {
    resolve,
    resolveStream,
    terminateStream,
    buildResolverMap,
    getStructure,
} from '@convey/core';

import {getCacheOptions} from '@convey/core/utils/resolvers';
import {entityReviver} from '@convey/core/utils/serialiser';

const CACHE_TRANSPORT_LEVEL = 'transport';

export async function handleResolver(req, res, structure) {
    const {options, stream} = structure;

    if (!stream) {
        try {
            const value = await resolve(structure);

            const content = JSON.stringify({payload: value, options});

            let cacheOptions = getCacheOptions(options, 'remote');

            if (cacheOptions.level === CACHE_TRANSPORT_LEVEL) {
                res.setHeader(
                    'Cache-Control',
                    `max-age=${Math.round(cacheOptions.ttl / 1000)}, public`
                );
            }

            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(content, 'utf-8'),
            });

            res.end(content);
        } catch (error) {
            const content = JSON.stringify({
                payload: {
                    message: error.message,
                },
                options,
                error: true,
            });

            res.writeHead(500, {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(content, 'utf-8'),
            });

            res.end(content);
        }

        return;
    }

    let finished = false;

    // TODO: consider stream reuse with users by resolveStream(structure);
    let iter = resolveStream(structure);

    function terminate() {
        finished = true;

        terminateStream(iter);
    }

    req.on('finish', terminate);
    req.on('close', terminate);
    res.on('finish', terminate);
    res.on('close', terminate);

    let id = 0;

    function writeStreamData(value) {
        // hack to keep streaming
        process.stdout.write('');

        res.write(`id: ${id}\n`);
        res.write(`event: ${options.id}\n`);
        res.write(`data: ${JSON.stringify({payload: value, options})}\n\n`);

        res.flushHeaders();
    }

    res.writeHead(200, {
        'Content-Type': 'text/event-stream;charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
    });

    res.flushHeaders();

    for await (let value of iter) {
        if (finished) break;

        writeStreamData(value);

        id += 1;
    }

    res.end();
}

export function createResolverHandler(
    resolvers: Parameters<typeof buildResolverMap>[0]
): (req: any, res: any) => Promise<void> {
    const resolversMap = buildResolverMap(resolvers);

    return async function handler(req, res) {
        const {query} = req;

        const id = query.id;
        const {params} = JSON.parse(
            query.b ? query.b : req.body.b,
            entityReviver
        );

        // TODO: handle wrong resolver id
        const structure = resolversMap[id as string].apply(this || {}, params);

        await handleResolver(req, res, getStructure(structure));
    };
}
