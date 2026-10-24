---
id: pagination
title: Pagination
sidebar_label: Pagination
description: 'Paginate through large result sets and use async iteration with the Scrapely API client for JavaScript.'
---

<!-- Derived from apify-client-js (docs/02_concepts/04_pagination.md), Copyright Apify Technologies s.r.o., Apache License 2.0. Modified by TeraShift GmbH. -->

import ApiLink from '@theme/ApiLink';

Methods that return lists (such as `list()` or `listSomething()`) return a <ApiLink to="interface/PaginatedList">`PaginatedList`</ApiLink> object. Exceptions include `listKeys()` and `listHead()`, which use different pagination mechanisms.

The list results are stored in the `items` property. Use the `limit` parameter to retrieve a specific number of results. Additional properties vary by method—see the method reference for details.

```js
import { ScrapelyClient } from 'scrapely-client';

const client = new ScrapelyClient({ token: 'MY-SCRAPELY-TOKEN' });

// Resource clients accept an ID of the resource.
const datasetClient = client.dataset('dataset-id');

// Maximum amount of items to fetch in total
const limit = 1000;
// Maximum amount of items to fetch in one API call
const chunkSize = 100;
// Initial offset
const offset = 0;

for await (const item of datasetClient.listItems({ limit, offset, chunkSize })) {
    // Processs individual item
    console.log(item);
}
```
