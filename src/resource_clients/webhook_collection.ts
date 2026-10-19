// Derived from apify-client-js (Copyright Apify Technologies s.r.o., Apache-2.0).
// Modified by TeraShift GmbH. See the LICENSE and NOTICE files.
import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginationOptions } from '../utils';
import type { Webhook, WebhookUpdateData } from './webhook';

/**
 * Client for managing the collection of Webhooks.
 *
 * Webhooks allow you to receive notifications when specific events occur in your Actors or tasks.
 * This client provides methods to list and create webhooks for specific Actors or tasks.
 *
 * @example
 * ```javascript
 * const client = new ScrapelyClient({ token: 'my-token' });
 *
 * // List webhooks for an Actor
 * const actorWebhooksClient = client.actor('my-actor-id').webhooks();
 * const { items } = await actorWebhooksClient.list();
 *
 * // Create a webhook
 * const newWebhook = await actorWebhooksClient.create({
 *   eventTypes: ['ACTOR.RUN.SUCCEEDED'],
 *   requestUrl: 'https://example.com/webhook'
 * });
 * ```
 *
 */
export class WebhookCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'webhooks',
            ...options,
        });
    }

    /**
     * Lists all Webhooks.
     *
     * Awaiting the return value (as you would with a Promise) will result in a single API call. The amount of fetched
     * items in a single API call is limited.
     * ```javascript
     * const paginatedList = await client.list(options);
     * ```
     *
     * Asynchronous iteration is also supported. This will fetch additional pages if needed until all items are
     * retrieved.
     *
     * ```javascript
     * for await (const singleItem of client.list(options)) {...}
     * ```
     *
     * @param options - Pagination and sorting options.
     * @returns A paginated iterator of webhooks.
     */

    list(
        options: WebhookCollectionListOptions = {},
    ): PaginatedIterator<Omit<Webhook, 'payloadTemplate' | 'headersTemplate'>> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number.not.negative,
                offset: ow.optional.number.not.negative,
                desc: ow.optional.boolean,
            }),
        );

        return this._listPaginated(options);
    }

    /**
     * Creates a new webhook.
     *
     * @param webhook - The webhook data.
     * @returns The created webhook object.
     */
    async create(webhook?: WebhookUpdateData): Promise<Webhook> {
        ow(webhook, ow.optional.object);

        return this._create(webhook);
    }
}

export interface WebhookCollectionListOptions extends PaginationOptions {
    desc?: boolean;
}
