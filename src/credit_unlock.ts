// Scrape.ly addition (TeraShift GmbH): "out of credit" data of the API.
import type { ApifyApiError } from './apify_api_error';

/**
 * The plan that unlocks held results or lets an account keep running when its free credit is used up.
 * Prices come from the API (the plan table), never from the client.
 */
export interface CreditUnlock {
    plan: string;
    planName: string;
    priceUsd: number;
    creditUsd: number;
    /** What the held results of a run cost out of the plan's credit (run.held.unlock only). */
    heldItemsCostUsd?: number;
    /** Console link that opens the checkout (for a held run: that run's page). Needs the user's login. */
    checkoutUrl: string;
}

/**
 * `error.data` of an HTTP 402 for the account balance (type `payment-required`, `insufficient-balance`,
 * `insufficient-funds`; the run's own charge route keeps `reason: 'insufficient-funds'`).
 */
export interface InsufficientCreditErrorData {
    reason: 'insufficient-credit' | 'insufficient-funds';
    /** The account's plan id ('free', 'starter', ...). */
    plan?: string;
    /** The Starter offer for a Free account; null for a paid account (see `topUpUrl`). */
    unlock?: CreditUnlock | null;
    /** A paid account's billing page, to add credit. */
    topUpUrl?: string;
    /** The account's newest run with held results, when it has one. */
    heldItems?: number;
    heldUntil?: string;
    runId?: string;
    /** Set when the account's free credit waits for identity verification. */
    kycUrl?: string;
}

/**
 * Results a run found after the account's free credit ran out. They are kept out of the run's dataset
 * until the account unlocks them (`unlock.checkoutUrl`) or `heldUntil` passes. Only on the owner's run.
 */
export interface ActorRunHeld {
    status: 'holding' | 'held' | 'released' | 'expired';
    items: number;
    events?: Record<string, number>;
    savedItems?: number;
    heldUntil?: string | null;
    releasedAt?: string | null;
    expiredAt?: string | null;
    unlock?: CreditUnlock | null;
}

/** Whether `err` is the API's 402 for the account balance (the unlock / top-up data is in `err.data`). */
export function isInsufficientCreditError(err: unknown): err is ApifyApiError & { data: InsufficientCreditErrorData } {
    const e = err as { statusCode?: unknown; data?: { reason?: unknown } | null } | null;
    return (
        !!e &&
        e.statusCode === 402 &&
        (e.data?.reason === 'insufficient-credit' || e.data?.reason === 'insufficient-funds')
    );
}

/** The link to show the user for a 402 for the balance: the unlock checkout, else the top-up page. */
export function creditUnlockUrl(err: unknown): string | undefined {
    if (!isInsufficientCreditError(err)) return undefined;
    return err.data.unlock?.checkoutUrl ?? err.data.topUpUrl ?? undefined;
}

/** One warning line for a run with held results that can still be unlocked, else undefined. */
export function heldRunWarning(run: { id?: string; held?: ActorRunHeld | null } | undefined): string | undefined {
    const held = run?.held;
    if (!held || !(held.items > 0) || (held.status !== 'holding' && held.status !== 'held')) return undefined;
    const n = held.items.toLocaleString('en-US');
    const until = held.heldUntil ? ` until ${held.heldUntil}` : '';
    const link = held.unlock?.checkoutUrl ? ` Unlock them: ${held.unlock.checkoutUrl}` : '';
    return `Run ${run!.id}: your free credit ran out, so ${n} more result${held.items === 1 ? ' is' : 's are'} held${until}.${link}`;
}
