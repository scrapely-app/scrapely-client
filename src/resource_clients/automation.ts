// Scrapely-only resource (not part of the reference API).
// Copyright TeraShift GmbH. See the LICENSE and NOTICE files.
import ow from 'ow';

import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { Dictionary, PaginatedList } from '../utils';
import { cast, catchNotFoundOrThrow, parseDateFields, pluckData, toPathSegment } from '../utils';

/**
 * Client for a specific automation (`/v2/automations/:id`).
 *
 * An automation is one trigger (manual, schedule or "another run finished"),
 * one or more run steps (an Actor with input, or a saved input with an
 * optional override), optional filters, an optional AI step and deliveries.
 * Plain schedules are automations too, so they also appear here.
 *
 * @example
 * ```javascript
 * const client = new ScrapelyClient({ token: 'my-token' });
 * const automation = client.automation('my-automation-id');
 * const run = await automation.run();
 * const { items } = await automation.listRuns({ limit: 5 });
 * ```
 */
export class AutomationClient extends ResourceClient {
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
     * Retrieves the automation.
     *
     * @returns The automation, or `undefined` if it does not exist.
     */
    async get(): Promise<Automation | undefined> {
        return this._get();
    }

    /**
     * Updates the automation. Only the given parts change; deliveries sent back
     * with their `id` and no new secret keep the stored secret.
     *
     * @param newFields - Fields to update.
     * @returns The updated automation.
     */
    async update(newFields: AutomationCreateOrUpdateData): Promise<Automation> {
        ow(newFields, ow.object);
        return this._update(newFields);
    }

    /**
     * Deletes the automation and its run history.
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * Runs the automation now, whatever its trigger.
     *
     * @returns The new automation run.
     */
    async run(): Promise<AutomationRun> {
        const response = await this.httpClient.call({
            url: this._url('runs'),
            method: 'POST',
            params: this._params(),
        });
        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * Lists the automation's runs, newest first (the last 30 are kept).
     *
     * @param options - Pagination options.
     * @returns A page of automation runs.
     */
    async listRuns(options: AutomationRunListOptions = {}): Promise<PaginatedList<AutomationRun>> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number.not.negative,
                offset: ow.optional.number.not.negative,
            }),
        );
        const response = await this.httpClient.call({
            url: this._url('runs'),
            method: 'GET',
            params: this._params(options),
        });
        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * Retrieves one run of the automation (steps, filter result, AI output and cost, deliveries).
     *
     * @param runId - Automation run ID.
     * @returns The run, or `undefined` if it does not exist.
     */
    async getRun(runId: string): Promise<AutomationRun | undefined> {
        ow(runId, ow.string.nonEmpty);
        try {
            const response = await this.httpClient.call({
                url: this._url(`runs/${toPathSegment(runId)}`),
                method: 'GET',
                params: this._params(),
            });
            return cast(parseDateFields(pluckData(response.data)));
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }
        return undefined;
    }

    /**
     * Creates a copy of the automation. Stored delivery secrets are copied on
     * the server. The copy is paused unless `isEnabled` is `true`.
     *
     * @param options - Optional title, name and enabled state of the copy.
     * @returns The new automation.
     */
    async duplicate(options: AutomationDuplicateOptions = {}): Promise<Automation> {
        ow(
            options,
            ow.object.exactShape({
                title: ow.optional.string,
                name: ow.optional.string,
                isEnabled: ow.optional.boolean,
            }),
        );
        const response = await this.httpClient.call({
            url: this._url('duplicate'),
            method: 'POST',
            params: this._params(),
            data: options,
        });
        return cast(parseDateFields(pluckData(response.data)));
    }
}

export type AutomationRunStatusFilter = 'SUCCEEDED' | 'FAILED' | 'ABORTED' | 'TIMED-OUT';

export type AutomationTrigger =
    | { kind: 'manual' }
    | { kind: 'schedule'; cron: string; timezone: string }
    | { kind: 'runFinished'; actorId?: string; savedInputId?: string; statuses?: AutomationRunStatusFilter[] };

export interface AutomationStepRunOptions {
    build?: string;
    timeoutSecs?: number;
    memoryMbytes?: number;
    maxItems?: number;
    maxTotalChargeUsd?: number;
    restartOnError?: boolean;
}

export type AutomationStep =
    | {
          id?: string;
          kind: 'actor';
          actorId: string;
          actorName?: string | null;
          input?: Dictionary | null;
          runOptions?: AutomationStepRunOptions | null;
      }
    | {
          id?: string;
          kind: 'savedInput';
          savedInputId: string;
          savedInputName?: string | null;
          savedInputTitle?: string | null;
          actorId?: string;
          actorName?: string | null;
          inputOverride?: Dictionary | null;
          runOptions?: AutomationStepRunOptions | null;
      };

export interface AutomationFilters {
    onlyWithResults?: boolean;
    onlyNewItems?: { keyFields: string[] } | null;
    conditions?: { field: string; op: string; value?: string | number | boolean | null }[];
}

export interface AutomationAiStep {
    mode: 'summarize' | 'filter' | 'compare' | 'extract';
    prompt: string;
}

export interface AutomationDelivery {
    id?: string;
    channel: 'dashboard' | 'email' | 'slack' | 'discord' | 'webhook' | 'googleSheets' | 'runAutomation';
    content?: 'ai' | 'digest' | 'both';
    /** Masked target (never the secret). */
    target?: string | null;
    [key: string]: unknown;
}

export interface AutomationOptions {
    isEnabled?: boolean;
    isExclusive?: boolean;
    notifyOnFailure?: boolean;
    maxWaitMinutes?: number | null;
    maxItemsPerStep?: number | null;
}

export interface Automation {
    id: string;
    name: string;
    title: string | null;
    description: string | null;
    trigger: AutomationTrigger;
    steps: AutomationStep[];
    filters: AutomationFilters | null;
    ai: AutomationAiStep | null;
    deliveries: AutomationDelivery[];
    options: AutomationOptions;
    nextRunAt: string | null;
    lastRunAt: string | null;
    createdAt: Date;
    modifiedAt: Date;
    legacyWorkflowId?: string | null;
    lastRun: {
        id: string;
        status: string;
        triggerKind: string;
        startedAt: Date;
        finishedAt: Date | null;
        aiCostUsd: number | null;
    } | null;
    [key: string]: unknown;
}

export interface AutomationCreateOrUpdateData {
    name?: string;
    title?: string | null;
    description?: string | null;
    trigger?: AutomationTrigger;
    steps?: AutomationStep[];
    filters?: AutomationFilters | null;
    ai?: AutomationAiStep | null;
    deliveries?: AutomationDelivery[];
    options?: AutomationOptions;
}

export interface AutomationRun {
    id: string;
    automationId: string;
    triggerKind: string;
    status: 'running' | 'processing' | 'delivering' | 'succeeded' | 'failed' | 'skipped';
    steps: Dictionary[];
    filter: Dictionary | null;
    aiOutput: string | null;
    aiCostUsd: number | null;
    aiStatus: string | null;
    aiNote: string | null;
    deliveries: Dictionary[];
    error: string | null;
    startedAt: Date;
    finishedAt: Date | null;
    [key: string]: unknown;
}

export interface AutomationRunListOptions {
    limit?: number;
    offset?: number;
}

export interface AutomationDuplicateOptions {
    title?: string;
    name?: string;
    isEnabled?: boolean;
}
