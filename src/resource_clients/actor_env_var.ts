// Derived from apify-client-js (Copyright Apify Technologies s.r.o., Apache-2.0).
// Modified by TeraShift GmbH. See the LICENSE and NOTICE files.
import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ActorEnvironmentVariable } from './actor_version';

/**
 * Client for managing a specific Actor environment variable.
 *
 * Environment variables are key-value pairs that are available to the Actor during execution.
 * This client provides methods to get, update, and delete environment variables.
 *
 * @example
 * ```javascript
 * const client = new ScrapelyClient({ token: 'my-token' });
 * const actorClient = client.actor('my-actor-id');
 * const versionClient = actorClient.version('0.1');
 *
 * // Get an environment variable
 * const envVarClient = versionClient.envVar('MY_VAR');
 * const envVar = await envVarClient.get();
 *
 * // Update environment variable
 * await envVarClient.update({ value: 'new-value' });
 * ```
 *
 */
export class ActorEnvVarClient extends ResourceClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'env-vars',
            ...options,
        });
    }

    /**
     * Retrieves the environment variable.
     *
     * @returns The environment variable object, or `undefined` if it does not exist.
     */
    async get(): Promise<ActorEnvironmentVariable | undefined> {
        return this._get();
    }

    /**
     * Updates the environment variable.
     *
     * @param actorEnvVar - The updated environment variable data.
     * @returns The updated environment variable object.
     */
    async update(actorEnvVar: ActorEnvironmentVariable): Promise<ActorEnvironmentVariable> {
        ow(actorEnvVar, ow.object);
        return this._update(actorEnvVar);
    }

    /**
     * Deletes the environment variable.
     *
     */
    async delete(): Promise<void> {
        return this._delete();
    }
}
