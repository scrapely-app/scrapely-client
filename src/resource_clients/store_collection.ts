// Derived from apify-client-js (Copyright Apify Technologies s.r.o., Apache-2.0).
// Modified by TeraShift GmbH. See the LICENSE and NOTICE files.
import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginationOptions } from '../utils';
import type { ActorStats } from './actor';

/**
 * Client for browsing Actors in the Scrapely Store.
 *
 * The Scrapely Store contains publicly available Actors that can be used by anyone.
 * This client provides methods to search and list Actors from the Store.
 *
 * @example
 * ```javascript
 * const client = new ScrapelyClient();
 * const storeClient = client.store();
 *
 * // Search for Actors in the Store
 * const { items } = await storeClient.list({ search: 'web scraper' });
 *
 * // Get details about a specific Store Actor
 * const actor = await storeClient.list({ username: 'username', actorName: 'web-scraper' });
 * ```
 *
 */
export class StoreCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            // Scrapely mounts the store listing at /v2/store/actors
            resourcePath: 'store/actors',
            ...options,
        });
    }

    /**
     * Lists Actors from the Scrapely Store.
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
     * @param options - Search and pagination options.
     * @returns A paginated iterator of store Actors.
     */
    list(options: StoreCollectionListOptions = {}): PaginatedIterator<ActorStoreList> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number.not.negative,
                offset: ow.optional.number.not.negative,
                search: ow.optional.string,
                sortBy: ow.optional.string,
                category: ow.optional.string,
                username: ow.optional.string,
                pricingModel: ow.optional.string,
                includeUnrunnableActors: ow.optional.boolean,
            }),
        );

        return this._listPaginated(options);
    }
}

export interface PricingInfo {
    pricingModel: string;
}

export interface ActorStoreList {
    id: string;
    name: string;
    username: string;
    title?: string;
    description?: string;
    stats: ActorStats;
    currentPricingInfo: PricingInfo;
    pictureUrl?: string;
    userPictureUrl?: string;
    url: string;
    /** A brief, LLM-generated readme summary */
    readmeSummary?: string;
}

export interface StoreCollectionListOptions extends PaginationOptions {
    search?: string;
    sortBy?: string;
    category?: string;
    username?: string;
    pricingModel?: string;
    /**
     * If true, the response will include Actors that cannot be run (e.g., Actors
     * that require a linked integration account that the current user does not have).
     */
    includeUnrunnableActors?: boolean;
}
