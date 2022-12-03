import unfetch from 'isomorphic-unfetch';

import {fetchEventSource} from '@microsoft/fetch-event-source';

import {callbackToIter, entityReviver} from '../utils';
import type {CancellableAsyncGenerator, ResolverOptions} from '../types';

const EventStreamContentType = 'text/event-stream';
const JSONContentType = 'application/json';

type MessageData = {
    options: ResolverOptions;
    payload: any;
    error?: boolean;
};

type Message = {
    stream?: boolean;
    data?: MessageData;
};
class ExpectedError extends Error {
    data?: MessageData;
    constructor(data?) {
        super('');

        this.data = data;
    }
}

type FetchedResolver = {
    params: any;
    options: ResolverOptions;
    stream: boolean;
};

type RequestHeaders = Record<string, string>;

const GET_LIMIT = 2048;

export function createResolverFetcher({
    url,
    openWhenHidden,
    reviver = entityReviver,
    headers = {},
}: {
    url?: string | ((structure: FetchedResolver) => string);
    openWhenHidden?: boolean;
    reviver?: typeof entityReviver;
    headers?: RequestHeaders | ((structure: FetchedResolver) => RequestHeaders);
} = {}) {
    return async function* fetchResolver(
        structure: FetchedResolver
    ): CancellableAsyncGenerator<Message> {
        yield* callbackToIter<Message>(({done, reject, next}) => {
            const ctrl =
                typeof AbortController !== 'undefined'
                    ? new AbortController()
                    : null;

            const {
                params,
                options: {id},
            } = structure;

            let link =
                typeof url === 'function'
                    ? url(structure)
                    : url || `/api/resolver/${id}`;

            const body = JSON.stringify({params, id});

            let methodOptions;

            if (body.length + link.length + 1 < GET_LIMIT) {
                methodOptions = {method: 'GET'};
                const getParams = new URLSearchParams({b: body}).toString();
                link += (link.includes('?') ? `&` : `?`) + getParams;
            } else {
                methodOptions = {
                    method: 'POST',
                    body: JSON.stringify({b: body}),
                };
            }

            fetchEventSource(link, {
                ...methodOptions,

                fetch: unfetch,

                signal: ctrl?.signal ?? undefined,

                openWhenHidden,

                headers: {
                    accept: [JSONContentType, EventStreamContentType].join(
                        ', '
                    ),
                    'content-type': JSONContentType,

                    ...(typeof headers === 'function'
                        ? headers(structure)
                        : headers),
                },

                async onopen(response) {
                    const contentType = response.headers.get('content-type');

                    if (contentType?.startsWith(JSONContentType)) {
                        throw new ExpectedError(
                            JSON.parse(await response.text(), reviver)
                        );
                    }

                    if (!contentType?.startsWith(EventStreamContentType)) {
                        throw new Error(
                            `Expected content-type to be ${EventStreamContentType}, Actual: ${contentType}`
                        );
                    }
                },

                onerror(err) {
                    if (err instanceof ExpectedError) {
                        done({stream: false, data: err.data});

                        throw new ExpectedError();
                    } else {
                        reject(err);
                    }
                },

                onmessage(message) {
                    next({data: JSON.parse(message.data, reviver)});
                },

                onclose() {
                    done({stream: true});
                },
            }).catch((err) => {
                if (err instanceof ExpectedError) {
                    return;
                }

                reject(err);
            });

            return () => {
                if (ctrl) ctrl.abort();
            };
        });
    };
}
