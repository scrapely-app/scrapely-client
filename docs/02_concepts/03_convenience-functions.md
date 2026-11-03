---
id: convenience-functions
title: Convenience functions
sidebar_label: Convenience functions
description: 'Use call(), waitForFinish(), and other convenience functions in the Scrapely API client for JavaScript.'
---

<!-- Derived from apify-client-js (docs/02_concepts/03_convenience-functions.md), Copyright Apify Technologies s.r.o., Apache License 2.0. Modified by TeraShift GmbH. -->

Some actions can't be performed by the API itself, such as indefinite waiting for an Actor run to finish (because of network timeouts). The client provides convenient `call()` and `waitForFinish()` functions that do that. Both accept a `waitSecs` limit; if the limit is reached, the returned promise is resolved to a run object that will have status `READY` or `RUNNING` and it will not contain the Actor run output.

[Key-value store](https://scrape.ly/docs/storage#key-value-stores) records can be retrieved as objects, buffers, or streams via the respective options, dataset items can be fetched as individual objects or serialized data.

```js
import { ScrapelyClient } from 'scrapely-client';

const client = new ScrapelyClient({ token: 'MY-SCRAPELY-TOKEN' });

// Starts an Actor and waits for it to finish.
const finishedActorRun = await client.actor('username/actor-name').call();

// Starts an Actor and lets the API wait up to 60s for the finish.
// The first argument is the Actor input, the second the run options.
const { status } = await client.actor('username/actor-name').start(
    { some: 'input' },
    { waitForFinish: 60 }, // 1 minute
);
```
