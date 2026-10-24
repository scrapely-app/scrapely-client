<!-- Derived from apify-client-js (README.md), Copyright Apify Technologies s.r.o., Apache License 2.0. Modified by TeraShift GmbH. -->

# Scrapely API client for JavaScript

[![npm version](https://badge.fury.io/js/scrapely-client.svg)](https://www.npmjs.com/package/scrapely-client)
[![Downloads](https://img.shields.io/npm/dm/scrapely-client.svg)](https://www.npmjs.com/package/scrapely-client)
[![License](https://img.shields.io/npm/l/scrapely-client)](./LICENSE)

`scrapely-client` is the official library to access the [Scrapely API](https://api.scrape.ly) from your
JavaScript applications. It runs both in Node.js and browser and provides
useful features like automatic retries and convenience functions that improve the experience of
using the Scrapely API.

<!-- toc -->

- [Quick Start](#quick-start)
- [Features](#features)
    - [Automatic parsing and error handling](#automatic-parsing-and-error-handling)
    - [Retries with exponential backoff](#retries-with-exponential-backoff)
    - [Convenience functions and options](#convenience-functions-and-options)
- [Usage concepts](#usage-concepts)
    - [Resource clients](#resource-clients)
    - [Nested clients](#nested-clients)
    - [Pagination](#pagination)
- [Bundled environments](#bundled-environments)
- [API Reference](#api-reference)

<!-- tocstop -->

## Quick Start

```js
const { ScrapelyClient } = require('scrapely-client');

const client = new ScrapelyClient({
    token: 'MY-SCRAPELY-TOKEN',
});

// Starts an Actor and waits for it to finish.
const { defaultDatasetId } = await client.actor('my-user/my-cool-actor').call();
// Fetches results from the Actor's dataset.
const { items } = await client.dataset(defaultDatasetId).listItems();
```

The client talks to `https://api.scrape.ly` unless you pass another `baseUrl` to the constructor. In Node.js, when `baseUrl` is not given, the `SCRAPELY_API_URL` environment variable sets the API URL (for example `SCRAPELY_API_URL=https://api-staging.scrape.ly`). `publicBaseUrl`, used for public storage links, keeps its own option and default. The browser bundle does not read environment variables.

## Features

Besides greatly simplifying the process of querying the Scrapely API, the client provides other useful features.

### Automatic parsing and error handling

Based on the endpoint, the client automatically extracts the relevant data and returns it in the
expected format. Date strings are automatically converted to `Date` objects. For exceptions,
we throw a `ScrapelyApiError`, which wraps the plain JSON errors returned by API and enriches
them with other context for easier debugging.

### Retries with exponential backoff

Network communication sometimes fails, that's a given. The client will automatically retry requests that
failed due to a network error, an internal error of the Scrapely API (HTTP 500+) or rate limit error (HTTP 429).
By default, it will retry up to 8 times. First retry will be attempted after ~500ms, second after ~1000ms
and so on. You can configure those parameters using the `maxRetries` and `minDelayBetweenRetriesMillis`
options of the `ScrapelyClient` constructor.

### Convenience functions and options

Some actions can't be performed by the API itself, such as indefinite waiting for an Actor run to finish
(because of network timeouts). The client provides convenient `call()` and `waitForFinish()` functions that do that.
Key-value store records can be retrieved as objects, buffers or streams via the respective options, dataset items
can be fetched as individual objects or serialized data and we plan to add better stream support and async iterators.

## Usage concepts

### Resource clients

The `ScrapelyClient` interface follows a generic pattern that is applicable to all of its components.
By calling individual methods of `ScrapelyClient`, specific clients which target individual API
resources are created. There are two types of those clients. A client for management of a single
resource and a client for a collection of resources.

```js
const { ScrapelyClient } = require('scrapely-client');
const client = new ScrapelyClient({ token: 'my-token' });

// Collection clients do not require a parameter.
const actorCollectionClient = client.actors();
// Creates an Actor with the name: my-actor.
const myActor = await actorCollectionClient.create({ name: 'my-actor' });
// Lists all of your Actors.
const { items } = await actorCollectionClient.list();
```

```js
// Collection clients do not require a parameter.
const datasetCollectionClient = client.datasets();
// Gets (or creates, if it doesn't exist) a dataset with the name of my-dataset.
const myDataset = await datasetCollectionClient.getOrCreate('my-dataset');
```

```js
// Resource clients accept an ID of the resource.
const actorClient = client.actor('my-user/my-actor');
// Fetches the my-user/my-actor object from the API.
const myActor = await actorClient.get();
// Starts the run of my-user/my-actor and returns the Run object.
const myActorRun = await actorClient.start();
```

```js
// Resource clients accept an ID of the resource.
const datasetClient = client.dataset('my-user/my-dataset');
// Appends items to the end of my-user/my-dataset.
await datasetClient.pushItems([{ foo: 1 }, { bar: 2 }]);
```

> The ID of the resource can be either the `id` of the said resource,
> or a combination of your `username/resource-name`.

This is really all you need to remember, because all resource clients
follow the pattern you see above.

### Nested clients

Sometimes clients return other clients. That's to simplify working with
nested collections, such as runs of a given Actor.

```js
const actorClient = client.actor('my-user/hello-world');
const runsClient = actorClient.runs();
// Lists the last 10 runs of the my-user/hello-world Actor.
const { items } = await runsClient.list({ limit: 10, desc: true });

// Selects the last run of the my-user/hello-world Actor that finished
// with a SUCCEEDED status.
const lastSucceededRunClient = actorClient.lastRun({ status: 'SUCCEEDED' });
// Fetches items from the run's dataset.
const { items } = await lastSucceededRunClient.dataset().listItems();
```

> The quick access to `dataset` and other storages directly from the run
> client can now only be used with the `lastRun()` method, but the feature
> will be available to all runs in the future.

### Automations

```js
const automation = await client.automations().create({
    title: 'Daily dentists',
    trigger: { kind: 'schedule', cron: '0 9 * * *', timezone: 'Europe/Berlin' },
    steps: [{ kind: 'savedInput', savedInputId: 'SAVED-INPUT-ID' }],
    ai: { mode: 'summarize', prompt: 'List the new practices with their phone numbers.' },
    deliveries: [{ channel: 'email' }],
});
// Runs it now and returns the automation run.
const run = await client.automation(automation.id).run();
```

`client.automations()` also lists automations (`actorId`, `savedInputId` and `search` filters), and
`client.automation(id)` gets, updates, deletes, duplicates and lists the runs of one.

### Pagination

Most methods named `list` or `listSomething` return a `Promise<PaginatedList>`.
There are some exceptions though, like `listKeys` or `listHead` which paginate differently.
The results you're looking for are always stored under `items` and you can use the `limit`
property to get only a subset of results. Other props are also available, depending on the method.

## Bundled environments

The package includes a pre-built browser bundle that is automatically resolved by bundlers targeting browser environments. You can also import it explicitly via

```typescript
import { ScrapelyClient } from 'scrapely-client/browser';
```

For edge runtimes like Cloudflare Workers, you may need to enable Node compatibility (e.g. `node_compat = true` in `wrangler.toml`). Note that some Node-specific features (streaming, proxy support) are not available in the bundle.

## API Reference

All public classes, methods and their parameters can be inspected in the [API reference](https://api.scrape.ly).

## License

Released under the [Apache License 2.0](./LICENSE); see [NOTICE](./NOTICE).
