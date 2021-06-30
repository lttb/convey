import {resolve, resolveStream, terminateStream} from '@convey/core';

import {getCacheOptions} from '@convey/core/utils/resolvers';

const CACHE_TRANSPORT_LEVEL = 'transport';

export async function handleResolver(req, res, structure) {
    const {options, stream} = structure;

    if (!stream) {
        let cacheOptions = getCacheOptions(options, 'remote');

        if (cacheOptions.level === CACHE_TRANSPORT_LEVEL) {
            res.setHeader(
                'Cache-Control',
                `max-age=${cacheOptions.ttl / 1000}`
            );
        }

        const value = await resolve(structure);

        const content = JSON.stringify({payload: value, options})

        res.writeHead(200, {
            Connection: 'close',
            'Content-Type': 'application/json',
            'Content-Length': content.length,
        });

        res.end(content);

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

        res.flush();
    }

    res.writeHead(200, {
        Connection: 'keep-alive',
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
