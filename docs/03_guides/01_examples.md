---
id: examples
title: Code examples
sidebar_label: Examples
description: 'Practical code examples for common tasks with the Scrapely API client for JavaScript, including webhooks and datasets.'
---

<!-- Derived from apify-client-js (docs/03_guides/01_examples.md), Copyright Apify Technologies s.r.o., Apache License 2.0. Modified by TeraShift GmbH. -->

## Passing an input to the Actor

The fastest way to get results from an Actor is to pass input directly to the `call` function.
Input can be passed to `call` function and the reference of running Actor (or wait for finish) is available in `runData` variable.

This example starts the `echofield/instagram-hashtag-scraper` Actor from Scrapely Store to get 20 posts for a hashtag.

```javascript
import { ScrapelyClient } from 'scrapely-client';

// Client initialization with the API token
const client = new ScrapelyClient({ token: 'MY_SCRAPELY_TOKEN' });

const actorClient = client.actor('echofield/instagram-hashtag-scraper');

const input = { hashtags: ['rainbow'], resultsLimit: 20 };

// Run the Actor and wait for it to finish up to 60 seconds.
// Input is not persisted for next runs.
const runData = await actorClient.call(input, { waitSecs: 60 });

console.log('Run data:');
console.log(runData);
```

To run multiple inputs with the same Actor, most convenient way is to create multiple [tasks](https://scrape.ly/docs/integrations#tasks) with different inputs. Task input is persisted on Scrapely platform when task is created.

```javascript
import { ScrapelyClient } from 'scrapely-client';

// Client initialization with the API token
const client = new ScrapelyClient({ token: 'MY_SCRAPELY_TOKEN' });

const animalsHashtags = ['zebra', 'lion', 'hippo'];

// Multiple input schemas for one Actor can be persisted in tasks.
// Tasks are saved in the Scrapely platform and can be run multiple times.
const socialsTasksPromises = animalsHashtags.map((hashtag) =>
    client.tasks().create({
        actId: 'echofield/instagram-hashtag-scraper',
        name: `hashtags-${hashtag}`,
        input: { hashtags: [hashtag], resultsLimit: 20 },
        options: { memoryMbytes: 1024 },
    }),
);

// Create all tasks in parallel
const createdTasks = await Promise.all(socialsTasksPromises);

console.log('Created tasks:');
console.log(createdTasks);

// Run all tasks in parallel
await Promise.all(createdTasks.map((task) => client.task(task.id).call()));
```

## Getting latest data from an Actor, joining datasets

Actor data are stored to [datasets](https://scrape.ly/docs/storage#datasets). Datasets can be retrieved from Actor runs. Dataset items can be listed with pagination. Also, datasets can be merged together to make analysis further on with single file as dataset can be exported to various data format (CSV, JSON, XSLX, XML). [Integrations](https://scrape.ly/docs/integrations-overview) can do the trick as well.

```javascript
import { ScrapelyClient } from 'scrapely-client';

// Client initialization with the API token
const client = new ScrapelyClient({ token: 'MY_SCRAPELY_TOKEN' });

const actorClient = client.actor('echofield/instagram-hashtag-scraper');

const actorRuns = actorClient.runs();

// See pagination to understand how to get more datasets
const actorDatasets = await actorRuns.list({ limit: 20 });

console.log('Actor datasets:');
console.log(actorDatasets);

const mergingDataset = await client.datasets().getOrCreate('merge-dataset');

for (const datasetItem of actorDatasets.items) {
    // Dataset items can be handled here. Dataset items can be paginated
    const datasetItems = await client.dataset(datasetItem.defaultDatasetId).listItems({ limit: 1000 });

    // Items can be pushed to single dataset
    await client.dataset(mergingDataset.id).pushItems(datasetItems.items);

    // ...
}
```

## Handling webhooks

[Webhooks](https://scrape.ly/docs/integrations#webhooks) can be used to get notifications about Actor runs.
For example, a webhook can be triggered when an Actor run finishes successfully.
Webhook can receive dataset ID for further processing.

Initialization of webhook:

```javascript
import { ScrapelyClient } from 'scrapely-client';

// Client initialization with the API token
const client = new ScrapelyClient({ token: 'MY_SCRAPELY_TOKEN' });

const webhooksClient = client.webhooks();

await webhooksClient.create({
    description: 'Instagram hashtag actor succeeded',
    condition: { actorId: 'echofield/instagram-hashtag-scraper' }, // Actor ID or username/actor-name
    // Request URL can be generated using https://webhook.site. Any REST server can be used
    requestUrl: 'https://webhook.site/CUSTOM_WEBHOOK_ID',
    eventTypes: ['ACTOR.RUN.SUCCEEDED'],
});
```

Simple webhook listener can be built on [`express`](https://expressjs.com/) library, which can helps to create a REST server for handling webhooks:

```javascript
import express from 'express';
import bodyParser from 'body-parser';
import { ScrapelyClient, DownloadItemsFormat } from 'scrapely-client';

// Initialize Scrapely client, express and define server port
const client = new ScrapelyClient({ token: 'MY_SCRAPELY_TOKEN' });
const app = express();
const PORT = 3000;

// Tell express to use body-parser's JSON parsing
app.use(bodyParser.json());

app.post('/scrapely-webhook', async (req, res) => {
    // Log the payload from the webhook. By default `resource` is the run object.
    console.log(req.body);

    const runDataset = client.dataset(req.body.resource.defaultDatasetId);

    // e.g. Download the dataset items as a JSON buffer
    const itemsJson = await runDataset.downloadItems(DownloadItemsFormat.JSON);

    // Respond to the webhook
    res.send('Webhook received');
});

// Start express on the defined port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
```
