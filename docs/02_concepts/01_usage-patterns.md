---
id: usage-patterns
title: Usage patterns
sidebar_label: Usage patterns
description: 'Learn the resource client and collection client patterns used by the Scrapely API client for JavaScript.'
---

<!-- Derived from apify-client-js (docs/02_concepts/01_usage-patterns.md), Copyright Apify Technologies s.r.o., Apache License 2.0. Modified by TeraShift GmbH. -->

import ApiLink from '@theme/ApiLink';

The `ScrapelyClient` interface follows a generic pattern that applies to all of its components. By calling individual methods of `ScrapelyClient`, specific clients that target individual API resources are created. There are two types of those clients:

- <ApiLink to="class/ActorClient">`ActorClient`</ApiLink>: a client for the management of a single resource
- <ApiLink to="class/ActorCollectionClient">`ActorCollectionClient`</ApiLink>: a client for the collection of resources

```js
import { ScrapelyClient } from 'scrapely-client';

const client = new ScrapelyClient({ token: 'MY-SCRAPELY-TOKEN' });

// Collection clients do not require a parameter.
const actorCollectionClient = client.actors();
// Creates an actor with the name: my-actor.
const myActor = await actorCollectionClient.create({ name: 'my-actor-name' });
// List all your used Actors (both own and from Scrapely Store)
const { items } = await actorCollectionClient.list();
```

:::note Resource identification

The resource ID can be either the `id` of the said resource, or a combination of your `username/resource-name`.

:::

```js
import { ScrapelyClient } from 'scrapely-client';

const client = new ScrapelyClient({ token: 'MY-SCRAPELY-TOKEN' });

// Resource clients accept an ID of the resource.
const actorClient = client.actor('username/actor-name');
// Fetches the john-doe/my-actor object from the API.
const myActor = await actorClient.get();
// Starts the run of john-doe/my-actor and returns the Run object.
const myActorRun = await actorClient.start();
```

## Nested clients

Sometimes clients return other clients. That's to simplify working with nested collections, such as runs of a given Actor.

```js
import { ScrapelyClient } from 'scrapely-client';

const client = new ScrapelyClient({ token: 'MY-SCRAPELY-TOKEN' });

const actorClient = client.actor('username/actor-name');
const runsClient = actorClient.runs();
// Lists the last 10 runs of your Actor.
const { items } = await runsClient.list({
    limit: 10,
    desc: true,
});

// Select the last run of your Actor that finished
// with a SUCCEEDED status.
const lastSucceededRunClient = actorClient.lastRun({ status: 'SUCCEEDED' });
// Fetches items from the run's dataset.
const { items } = await lastSucceededRunClient.dataset().listItems();
```

The quick access to `dataset` and other storage directly from the run client can be used with the <ApiLink to="class/ActorClient#lastRun">`lastRun()`</ApiLink> method.
