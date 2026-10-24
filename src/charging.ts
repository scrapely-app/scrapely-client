import ow from 'ow';

import type { ApiClientSubResourceOptions } from './base/api_client';
import { DatasetClient } from './resource_clients/dataset';
import { isNode } from './utils';
import type { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Marks dataset clients whose `pushItems()` charges pay-per-event items
 * instead of pushing them directly. Host SDKs (e.g. `scrapely`) check this
 * symbol to detect that push-data interception is already active.
 */
export const USES_PUSH_DATA_INTERCEPTION = Symbol('scrapely:uses-push-data-interception');

/**
 * Result of a charged push-data operation.
 *
 * Mirrors the SDK-side `ChargeResult` contract; the client only stores and
 * merges these values, it never computes them.
 */
export interface ChargeResult {
    /** Whether an event charge limit was reached during the operation. */
    eventChargeLimitReached: boolean;
    /** Total number of charged items. */
    chargedCount: number;
    /** How many more items could be charged per event within the current limits. */
    chargeableWithinLimit: Record<string, number>;
}

/**
 * Context carried through `pushDataChargingContext` so callers can associate
 * a charge result with their own push-data call (pay-per-event aware pushes).
 */
export interface PpeAwarePushDataContext {
    /** Event name to charge instead of the default dataset-item event. */
    eventName: string | undefined;
    /** Accumulated charge result of all pushes made within this context. */
    chargeResult?: ChargeResult;
}

/**
 * Minimal async-local storage interface (subset of `AsyncLocalStorage`).
 */
export interface ChargingContextStorage {
    getStore(): PpeAwarePushDataContext | undefined;
    run<R, TArgs extends unknown[]>(store: PpeAwarePushDataContext, callback: (...args: TArgs) => R, ...args: TArgs): R;
}

function createChargingContextStorage(): ChargingContextStorage {
    if (isNode()) {
        try {
            // Lazily required so the browser bundle (where `node:async_hooks` is
            // aliased away) never pulls it in; charging interception is Node-only.
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const asyncHooks = require('node:async_hooks') as { AsyncLocalStorage?: typeof AsyncLocalStorage };
            if (asyncHooks?.AsyncLocalStorage) {
                const als = new asyncHooks.AsyncLocalStorage<PpeAwarePushDataContext>();
                return {
                    getStore: () => als.getStore(),
                    run: (store, callback, ...args) => als.run(store, callback, ...args),
                };
            }
        } catch {
            // Fall through to the no-op storage below.
        }
    }

    // Browser fallback: no ambient context; intercepted pushes run without one.
    return {
        getStore: () => undefined,
        run: (store, callback, ...args) => {
            void store;
            return callback(...args);
        },
    };
}

/**
 * Async-local storage for the current {@link PpeAwarePushDataContext}.
 *
 * Wrapping a push in `pushDataChargingContext.run({ eventName }, fn)` makes
 * every intercepted `pushItems()` inside `fn` charge `eventName` and merge its
 * result into the context.
 */
export const pushDataChargingContext = createChargingContextStorage();

/** Options accepted by {@link ChargingHooks.pushAndCharge}. */
export interface PushAndChargeOptions<Data extends Record<string | number, any>> {
    /** Normalized items to push (and charge for). */
    items: Data[];
    /** Event name to charge; when omitted the hook decides (default dataset-item event). */
    eventName?: string;
    /**
     * Persists the budget-limited subset of items. Implementations must call this
     * with only the items that were actually accepted for charging.
     */
    pushFn: (limitedItems: Data[]) => Promise<void>;
}


/**
 * Charging hooks supplied by the host SDK (e.g. `scrapely`'s `ChargingManager`).
 *
 * The client deliberately knows nothing about pricing, budgets or ledgers —
 * it only routes `pushItems()` through these hooks when they are configured
 * and the dataset is the actor run's default dataset. Without hooks, `pushItems()`
 * behaves as usual.
 */
export interface ChargingHooks {
    /** Whether pushes to this dataset should be intercepted and charged. */
    shouldChargeDatasetPushes(datasetId: string): boolean;
    /** Charge for (and persist) the given items. */
    pushAndCharge<Data extends Record<string | number, any>>(
        options: PushAndChargeOptions<Data>,
    ): Promise<ChargeResult>;
    /** Merge two charge results (e.g. multiple pushes within one context). */
    mergeChargeResults(a: ChargeResult, b: ChargeResult): ChargeResult;
}

/**
 * A {@link DatasetClient} whose `pushItems()` routes through charging hooks.
 *
 * Semantics:
 * normalize items → `pushAndCharge` with a `pushFn` that serializes the
 * accepted subset back to the stock `pushItems()`, and accumulate the charge
 * result into the ambient {@link pushDataChargingContext} when present.
 *
 * @private
 */
export class ChargingDatasetClient<
    Data extends Record<string | number, any> = Record<string | number, unknown>,
> extends DatasetClient<Data> {
    private readonly hooks: ChargingHooks;

    constructor(options: ApiClientSubResourceOptions & { hooks: ChargingHooks }) {
        const { hooks, ...clientOptions } = options;
        super(clientOptions);
        this.hooks = hooks;
    }

    private normalizeItems(items: string | Data | string[] | Data[]): Data[] {
        if (typeof items === 'string') {
            const parsed = JSON.parse(items);
            return Array.isArray(parsed) ? parsed : [parsed];
        }

        if (Array.isArray(items)) {
            return items.flatMap((item) =>
                typeof item === 'string' ? (JSON.parse(item) as Data | Data[]) : item,
            ) as Data[];
        }

        return [items];
    }

    override async pushItems(items: string | Data | string[] | Data[]): Promise<void> {
        // The same input check as the stock pushItems(), and every item must
        // serialize, before the hooks charge for it: the push itself happens only
        // after the charge and would fail with the items charged but not stored.
        ow(items, ow.any(ow.object, ow.string, ow.array.ofType(ow.any(ow.object, ow.string))));
        const context = pushDataChargingContext.getStore();
        const normalizedItems = this.normalizeItems(items);
        normalizedItems.forEach((item, index) => {
            let json: string | undefined;
            try {
                json = JSON.stringify(item);
            } catch (err) {
                throw new Error(`Dataset item at index ${index} is not serializable to JSON: ${(err as Error).message}`);
            }
            if (json === undefined) throw new Error(`Dataset item at index ${index} is not serializable to JSON`);
        });

        const result = await this.hooks.pushAndCharge({
            items: normalizedItems,
            eventName: context?.eventName,
            pushFn: async (limitedItems) => {
                await super.pushItems(JSON.stringify(limitedItems));
            },
        });

        if (!context) return;

        if (context.chargeResult === undefined) {
            context.chargeResult = result;
        } else {
            context.chargeResult = this.hooks.mergeChargeResults(context.chargeResult, result);
        }
    }
}

/**
 * Returns a charging-aware dataset client when charging is enabled for `id`
 * (hooks configured, `id` is the default dataset, and the hooks confirm the
 * dataset should be charged), or a stock {@link DatasetClient} otherwise.
 *
 * @private
 */
export function createDatasetClient<
    Data extends Record<string | number, any> = Record<string | number, unknown>,
>(
    id: string,
    options: ApiClientSubResourceOptions,
    chargingHooks: ChargingHooks | undefined,
    defaultDatasetId: string | undefined,
): DatasetClient<Data> {
    const isDefaultDataset = id === defaultDatasetId;

    if (chargingHooks && isDefaultDataset && chargingHooks.shouldChargeDatasetPushes(id)) {
        const client = new ChargingDatasetClient<Data>({ id, ...options, hooks: chargingHooks });
        Object.assign(client as object, { [USES_PUSH_DATA_INTERCEPTION]: true });
        return client;
    }

    return new DatasetClient<Data>({ id, ...options });
}

