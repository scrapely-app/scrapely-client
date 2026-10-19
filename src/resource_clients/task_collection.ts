// Derived from apify-client-js (Copyright Apify Technologies s.r.o., Apache-2.0).
// Modified by TeraShift GmbH. See the LICENSE and NOTICE files.
import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginationOptions } from '../utils';
import type { Task, TaskUpdateData } from './task';

/**
 * Client for managing the collection of Actor tasks in your account.
 *
 * Tasks are pre-configured Actor runs with saved input and options. This client provides
 * methods to list and create tasks.
 *
 * @example
 * ```javascript
 * const client = new ScrapelyClient({ token: 'my-token' });
 * const tasksClient = client.tasks();
 *
 * // List all tasks
 * const { items } = await tasksClient.list();
 *
 * // Create a new task
 * const newTask = await tasksClient.create({
 *   actId: 'my-actor-id',
 *   name: 'my-task',
 *   input: { url: 'https://example.com' }
 * });
 * ```
 *
 */
export class TaskCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'actor-tasks',
            ...options,
        });
    }

    /**
     * Lists all Tasks.
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
     * @param options - Pagination and sorting options.
     * @returns A paginated iterator of tasks.
     */
    list(options: TaskCollectionListOptions = {}): PaginatedIterator<TaskList> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number.not.negative,
                offset: ow.optional.number.not.negative,
                desc: ow.optional.boolean,
            }),
        );

        return this._listPaginated(options);
    }

    /**
     * Creates a new task.
     *
     * @param task - The task data.
     * @returns The created task object.
     */
    async create(task: TaskCreateData): Promise<Task> {
        ow(task, ow.object);

        return this._create(task);
    }
}

export interface TaskCollectionListOptions extends PaginationOptions {
    desc?: boolean;
}

export type TaskList = Omit<Task, 'options' | 'input'>;

export interface TaskCreateData extends TaskUpdateData {
    actId: string;
}
