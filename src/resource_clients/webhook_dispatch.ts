// Derived from apify-client-js (Copyright Apify Technologies s.r.o., Apache-2.0).
// Modified by TeraShift GmbH. See the LICENSE and NOTICE files.
import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { Webhook, WebhookEventType } from './webhook';

/**
 * Client for managing a specific webhook dispatch.
 *
 * Webhook dispatches represent individual notifications sent by webhooks. This client provides
 * methods to retrieve details about a specific dispatch.
 *
 * @example
 * ```javascript
 * const client = new ScrapelyClient({ token: 'my-token' });
 * const webhookClient = client.webhook('my-webhook-id');
 *
 * // Get a specific dispatch
 * const dispatchClient = webhookClient.dispatches().get('dispatch-id');
 * const dispatch = await dispatchClient.get();
 * ```
 *
 */
export class WebhookDispatchClient extends ResourceClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'webhook-dispatches',
            ...options,
        });
    }

    /**
     * Retrieves the webhook dispatch.
     *
     * @returns The webhook dispatch object, or `undefined` if it does not exist.
     */
    async get(): Promise<WebhookDispatch | undefined> {
        return this._get();
    }
}

export interface WebhookDispatch {
    id: string;
    userId: string;
    webhookId: string;
    createdAt: Date;
    status: WebhookDispatchStatus;
    eventType: WebhookEventType;
    calls: WebhookDispatchCall[];
    webhook: Pick<Webhook, 'requestUrl' | 'isAdHoc'>;
    eventData: WebhookDispatchEventData | null;
}

export enum WebhookDispatchStatus {
    Active = 'ACTIVE',
    Succeeded = 'SUCCEEDED',
    Failed = 'FAILED',
}

export interface WebhookDispatchCall {
    startedAt: Date;
    finishedAt: Date;
    errorMessage: string | null;
    responseStatus: number | null;
    responseBody: string | null;
}

export interface WebhookDispatchEventData {
    actorRunId?: string;
    actorId?: string;
    actorTaskId?: string;
    actorBuildId?: string;
}
