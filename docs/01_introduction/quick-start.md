---
id: quick-start
title: Quick start
sidebar_label: Quick start
description: 'Get started with the Scrapely API client for JavaScript by running an Actor and retrieving results from its dataset.'
---

<!-- Derived from apify-client-js (docs/01_introduction/quick-start.md), Copyright Apify Technologies s.r.o., Apache License 2.0. Modified by TeraShift GmbH. -->

import ApiLink from '@theme/ApiLink';

Learn how to authenticate, run Actors, and retrieve results using the Scrapely API client for JavaScript.

---

## Step 1: Authenticate the client

To use the client, you need an [API token](https://api.scrape.ly/platform/integrations/api#api-token). You can find your token under [Integrations](https://api.scrape.ly) tab in the Scrapely dashboard. Copy the token and initialize the client by providing the token (`MY-SCRAPELY-TOKEN`) as a parameter to the `ScrapelyClient` constructor.

```js
import { ScrapelyClient } from 'scrapely-client';

// Client initialization with the API token
const client = new ScrapelyClient({
    token: 'MY-SCRAPELY-TOKEN',
});
```

:::warning Secure access

The API token is used to authorize your requests to the Scrapely API. You can be charged for the usage of the underlying services, so do not share your API token with untrusted parties or expose it on the client side of your applications.

:::

## Step 2: Run an Actor

To start an Actor, call the <ApiLink to="class/ActorClient">`client.actor()`</ApiLink> method with the Actor's ID (e.g. `john-doe/my-cool-actor`). The Actor's ID is a combination of the Actor owner's username and the Actor name. You can run both your own Actors and Actors from Scrapely Store.

To define the Actor's input, pass a JSON object to the <ApiLink to="class/ActorClient#call">`call()`</ApiLink> method that matches the Actor's [input schema](https://api.scrape.ly/platform/actors/development/actor-definition/input-schema). The input can include URLs to scrape, search terms, or other configuration data.

```js
import { ScrapelyClient } from 'scrapely-client';

const client = new ScrapelyClient({ token: 'MY-SCRAPELY-TOKEN' });

// Runs an Actor with an input and waits for it to finish.
const { defaultDatasetId } = await client.actor('username/actor-name').call({
    some: 'input',
});
```

## Step 3: Get results from the dataset

To get the results from the dataset, call the <ApiLink to="class/DatasetClient">`client.dataset()`</ApiLink> method with the dataset ID, then call <ApiLink to="class/DatasetClient#listItems">`listItems()`</ApiLink> to retrieve the data. You can get the dataset ID from the Actor's run object (represented by `defaultDatasetId`).

```js
import { ScrapelyClient } from 'scrapely-client';

const client = new ScrapelyClient({ token: 'MY-SCRAPELY-TOKEN' });

// Runs an Actor and waits for it to finish
const { defaultDatasetId } = await client.actor('username/actor-name').call();

// Lists items from the Actor's dataset
const { items } = await client.dataset(defaultDatasetId).listItems();
console.log(items);
```

:::note Dataset access

Running an Actor might take time, depending on the Actor's complexity and the amount of data it processes. If you want only to get data and have an immediate response you should access the existing dataset of the finished [Actor run](https://api.scrape.ly/platform/actors/running/runs-and-builds#runs).

:::

## Next steps

### Concepts

To learn more about how the client works, check out the Concepts section in the sidebar:

- [Usage patterns](../02_concepts/01_usage-patterns.md) - resource clients, collection clients, and nested clients
- [Error handling and retries](../02_concepts/02_error-handling.md) - automatic retries with exponential backoff
- [Convenience functions](../02_concepts/03_convenience-functions.md) - `call()`, `waitForFinish()`, and more
- [Pagination](../02_concepts/04_pagination.md) - iterating through large result sets

### Guides

For practical examples of common tasks, see [Code examples](../03_guides/01_examples.md).
