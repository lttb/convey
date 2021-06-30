import unfetch from 'isomorphic-unfetch';

import {fetchEventSource} from '@microsoft/fetch-event-source';

import {callbackToIter} from '../utils';
import type {CancellableAsyncGenerator, ResolverOptions} from '../types';

const EventStreamContentType = 'text/event-stream';
const JSONContentType = 'application/json';

type MessageData = {
    options: ResolverOptions;
    payload: any;
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

const GET_LIMIT = 2048;

export function createResolverFetcher(
    options: {
        url?: string | ((structure: FetchedResolver) => string);
        openWhenHidden?: boolean;
    } = {}
) {
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
                typeof options.url === 'function'
                    ? options.url(structure)
                    : options.url || `/api/resolver/${id}`;

            const body = JSON.stringify({params, id});

            let methodOptions;

            if (body.length + link.length + 1 < GET_LIMIT) {
                methodOptions = {method: 'GET'};
                const getParams = new URLSearchParams({b: body}).toString();
                link += (link.includes('?') ? `&` : `?`) + getParams;
            } else {
                methodOptions = {method: 'POST', body};
            }

            fetchEventSource(link, {
                ...methodOptions,

                fetch: unfetch,

                signal: ctrl?.signal ?? undefined,

                openWhenHidden: options.openWhenHidden ?? false,

                headers: {
                    accept: [JSONContentType, EventStreamContentType].join(
                        ', '
                    ),
                    'content-type': JSONContentType,
                },

                async onopen(response) {
                    const contentType = response.headers.get('content-type');

                    if (contentType?.startsWith(JSONContentType)) {
                        throw new ExpectedError(await response.json());
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
                    next({data: JSON.parse(message.data)});
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
