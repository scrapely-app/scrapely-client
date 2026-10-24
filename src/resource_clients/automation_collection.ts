// Scrapely-only resource (not part of the reference API).
// Copyright TeraShift GmbH. See the LICENSE and NOTICE files.
import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginationOptions } from '../utils';
import type { Automation, AutomationCreateOrUpdateData } from './automation';

/**
 * Client for the automations in your account (`/v2/automations`).
 *
 * @example
 * ```javascript
 * const client = new ScrapelyClient({ token: 'my-token' });
 * const { items } = await client.automations().list({ actorId: 'username~my-actor' });
 * const automation = await client.automations().create({
 *     title: 'Daily dentists',
 *     trigger: { kind: 'schedule', cron: '0 9 * * *', timezone: 'Europe/Berlin' },
 *     steps: [{ kind: 'savedInput', savedInputId: 'my-saved-input-id' }],
 * });
 * ```
 */
export class AutomationCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'automations',
            ...options,
        });
    }

    /**
     * Lists automations. Awaiting the result makes one API call; `for await`
     * fetches further pages.
     *
     * @param options - Pagination, search and filters (`actorId`: any step or
     *   run-finished trigger uses the Actor; `savedInputId`: any step or trigger uses it).
     * @returns A paginated iterator of automations.
     */
    list(options: AutomationCollectionListOptions = {}): PaginatedIterator<Automation> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number.not.negative,
                offset: ow.optional.number.not.negative,
                desc: ow.optional.boolean,
                search: ow.optional.string,
                actorId: ow.optional.string,
                savedInputId: ow.optional.string,
            }),
        );

        return this._listPaginated(options);
    }

    /**
     * Creates an automation.
     *
     * @param automation - Trigger, steps and optional filters, AI step, deliveries and options.
     * @returns The created automation.
     */
    async create(automation: AutomationCreateOrUpdateData): Promise<Automation> {
        ow(automation, ow.object);

        return this._create(automation);
    }
}

export interface AutomationCollectionListOptions extends PaginationOptions {
    desc?: boolean;
    search?: string;
    actorId?: string;
    savedInputId?: string;
}
