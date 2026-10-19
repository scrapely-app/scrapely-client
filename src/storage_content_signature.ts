import { createHmacSignatureAsync } from '@apify/utilities';

/**
 * Storage URL signature shared with `scrapely-server/src/utils/storageSignature.ts`.
 *
 * Message:
 *   `${version}.${expiresAt}.${resourceId}.${METHOD}.${path}.${recordKey}`
 *
 * `recordKey` is empty unless the URL is for one record. Omitting
 * `expiresInSecs` mints a one-hour signature. `expiresInSecs <= 0` is rejected
 * so a caller cannot ask for a non-expiring (`expiresAt = 0`) signature.
 */
export const DEFAULT_STORAGE_URL_EXPIRES_SECS = 60 * 60;
const SIGNATURE_VERSION = 1;

export async function createBoundStorageContentSignature(options: {
    resourceId: string;
    urlSigningSecretKey: string;
    method: string;
    path: string;
    recordKey?: string;
    expiresInSecs?: number;
}): Promise<string> {
    const expiresInSecs = options.expiresInSecs ?? DEFAULT_STORAGE_URL_EXPIRES_SECS;
    if (!Number.isFinite(expiresInSecs) || expiresInSecs <= 0) {
        throw new Error('expiresInSecs must be a positive number of seconds');
    }
    const expiresAt = Date.now() + Math.round(expiresInSecs * 1000);
    const version = SIGNATURE_VERSION;
    const recordKey = options.recordKey ?? '';
    const message = `${version}.${expiresAt}.${options.resourceId}.${options.method.toUpperCase()}.${options.path}.${recordKey}`;
    const hmac = await createHmacSignatureAsync(options.urlSigningSecretKey, message);
    // base64url by hand: the browser bundle's Buffer polyfill has no 'base64url' encoding.
    // Same output as Node's Buffer#toString('base64url') (URL-safe alphabet, no padding).
    return Buffer.from(`${version}.${expiresAt}.${hmac}`, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
