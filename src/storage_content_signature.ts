import { createHmacSignatureAsync } from '@apify/utilities';

/**
 * Storage URL signature shared with `scrapely-server/src/utils/storageSignature.ts`
 * and the Python client (`scrapely_client/_utils/crypto.py`).
 *
 * Message (version 2):
 *   `${version}.${expiresAt}.${resourceId}.${METHOD}.${path}.${recordKey}.${query}`
 *
 * `recordKey` is empty unless the URL is for one record. `query` is
 * `storageSignatureQuery()` of the finished URL, so set every other query
 * parameter before signing. Omitting `expiresInSecs` mints a one-hour
 * signature. `expiresInSecs <= 0` is rejected so a caller cannot ask for a
 * non-expiring (`expiresAt = 0`) signature.
 */
export const DEFAULT_STORAGE_URL_EXPIRES_SECS = 60 * 60;
const SIGNATURE_VERSION = 2;

/** RFC 3986 percent-encoding: everything except `A-Z a-z 0-9 - . _ ~`. */
function encodeQueryComponent(value: string): string {
    return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * Canonical query string a signature binds. The raw query of `url` is parsed
 * with `URLSearchParams`, `signature` is dropped, each key and value is
 * percent-encoded (RFC 3986), and the pairs are sorted by encoded key, then
 * encoded value, and joined as `k=v&k=v`. With no `?` the query is empty.
 */
export function storageSignatureQuery(url: string): string {
    const start = url.indexOf('?');
    if (start === -1) return '';
    const hash = url.indexOf('#', start);
    const raw = hash === -1 ? url.slice(start + 1) : url.slice(start + 1, hash);
    const pairs: [string, string][] = [];
    new URLSearchParams(raw).forEach((value, key) => {
        if (key !== 'signature') pairs.push([encodeQueryComponent(key), encodeQueryComponent(value)]);
    });
    pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
    return pairs.map(([key, value]) => `${key}=${value}`).join('&');
}

export async function createBoundStorageContentSignature(options: {
    resourceId: string;
    urlSigningSecretKey: string;
    method: string;
    path: string;
    recordKey?: string;
    /** `storageSignatureQuery()` of the URL being signed. */
    query?: string;
    expiresInSecs?: number;
}): Promise<string> {
    const expiresInSecs = options.expiresInSecs ?? DEFAULT_STORAGE_URL_EXPIRES_SECS;
    if (!Number.isFinite(expiresInSecs) || expiresInSecs <= 0) {
        throw new Error('expiresInSecs must be a positive number of seconds');
    }
    const expiresAt = Date.now() + Math.round(expiresInSecs * 1000);
    const version = SIGNATURE_VERSION;
    const recordKey = options.recordKey ?? '';
    const query = options.query ?? '';
    const message = `${version}.${expiresAt}.${options.resourceId}.${options.method.toUpperCase()}.${options.path}.${recordKey}.${query}`;
    const hmac = await createHmacSignatureAsync(options.urlSigningSecretKey, message);
    // base64url by hand: the browser bundle's Buffer polyfill has no 'base64url' encoding.
    // Same output as Node's Buffer#toString('base64url') (URL-safe alphabet, no padding).
    return Buffer.from(`${version}.${expiresAt}.${hmac}`, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
