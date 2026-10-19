// Derived from apify-client-js (Copyright Apify Technologies s.r.o., Apache-2.0).
// Modified by TeraShift GmbH. See the LICENSE and NOTICE files.
import ow from 'ow';

import { STORAGE_OWNERSHIP_FILTER } from '@apify/consts';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedList, PaginationOptions } from '../utils';
import type { Dataset } from './dataset';

/**
 * Client for managing the collection of datasets in your account.
 *
 * Datasets store structured data results from Actor runs. This client provides methods
 * to list, create, or get datasets by name.
 *
 * @example
 * ```javascript
 * const client = new ScrapelyClient({ token: 'my-token' });
 * const datasetsClient = client.datasets();
 *
 * // List all datasets
 * const { items } = await datasetsClient.list();
 *
 * // Get or create a dataset by name
 * const dataset = await datasetsClient.getOrCreate('my-dataset');
 * ```
 *
 */
export class DatasetCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'datasets',
            ...options,
        });
    }

    /**
     * Lists all Datasets.
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
     * @param options - Pagination options.
     * @returns A paginated iterator of Datasets.
     */
    list(
        options: DatasetCollectionClientListOptions = {},
    ): Promise<DatasetCollectionClientListResult> & AsyncIterable<Dataset> {
        ow(
            options,
            ow.object.exactShape({
                unnamed: ow.optional.boolean,
                limit: ow.optional.number.not.negative,
                offset: ow.optional.number.not.negative,
                desc: ow.optional.boolean,
                ownership: ow.optional.string.oneOf(Object.values(STORAGE_OWNERSHIP_FILTER)),
            }),
        );

        return this._listPaginated(options);
    }

    /**
     * Gets or creates a dataset with the specified name.
     *
     * @param name - Name of the dataset. If not provided, a default dataset is used.
     * @param options - Additional options like schema.
     * @returns The dataset object.
     */
    async getOrCreate(name?: string, options?: DatasetCollectionClientGetOrCreateOptions): Promise<Dataset> {
        ow(name, ow.optional.string);
        ow(options?.schema, ow.optional.object); // TODO: Add schema validatioon

        return this._getOrCreate(name, options);
    }
}

export interface DatasetCollectionClientListOptions extends PaginationOptions {
    unnamed?: boolean;
    desc?: boolean;
    /** Filter by ownership: 'ownedByMe' returns only user's own datasets, 'sharedWithMe' returns only shared datasets. */
    ownership?: STORAGE_OWNERSHIP_FILTER;
}

export interface DatasetCollectionClientGetOrCreateOptions {
    schema?: Record<string, unknown>;
}

export type DatasetCollectionClientListResult = PaginatedList<Dataset> & { unnamed: boolean };
