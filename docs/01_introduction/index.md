---
id: introduction
title: Overview
sidebar_label: Overview
slug: /
description: 'The official JavaScript library to access the Scrapely API, with automatic retries, TypeScript support, and cross-platform compatibility.'
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

The Scrapely API client is the official library to access the [Scrapely REST API](https://api.scrape.ly/api/v2) from your JavaScript/TypeScript applications. It runs both in Node.js and browser and provides useful features like automatic retries and convenience functions that improve the experience of using the Scrapely API.

The client simplifies interaction with the Scrapely platform by providing:

- Intuitive methods for working with [Actors](https://api.scrape.ly/platform/actors), [datasets](https://api.scrape.ly/platform/storage/dataset), [key-value stores](https://api.scrape.ly/platform/storage/key-value-store), and other Scrapely resources
- Intelligent parsing of API responses and rich error messages for debugging
- Built-in [exponential backoff](../02_concepts/02_error-handling.md#retries-with-exponential-backoff) for failed requests
- Full TypeScript support with comprehensive type definitions
- Cross-platform compatibility in [Node.js](https://nodejs.org/) v16+ and modern browsers

All requests and responses (including errors) are encoded in JSON format with UTF-8 encoding.

## Pre-requisites

`scrapely-client` requires Node.js version 16 or higher. Node.js is available for download on the [official website](https://nodejs.org/). Check for your current Node.js version by running:

```bash
node -v
```

## Installation

You can install the client via [NPM](https://www.npmjs.com/) or any other package manager of your choice.

<Tabs groupId="main">
<TabItem value="npm" label="NPM">

```bash
npm i scrapely-client
```

</TabItem>
<TabItem value="yarn" label="Yarn">

```bash
yarn add scrapely-client
```

</TabItem>
<TabItem value="pnpm" label="PNPM">

```bash
pnpm add scrapely-client
```

</TabItem>
<TabItem value="bun" label="Bun">

```bash
bun add scrapely-client
```

</TabItem>
</Tabs>

## Quick example

Here's an example showing how to run an Actor and retrieve its results:

```javascript
import { ScrapelyClient } from 'scrapely-client';

// Initialize the client with your API token
const client = new ScrapelyClient({
    token: 'MY-SCRAPELY-TOKEN',
});

// Start an Actor and wait for it to finish
const run = await client.actor('my-user/web-scraper').call({
    startUrls: [{ url: 'https://example.com' }],
    maxCrawlPages: 10,
});

// Get results from the Actor's dataset
const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(items);
```

> You can find your API token in the [Integrations section](https://api.scrape.ly) of the Scrapely dashboard. See the [Quick start guide](./quick-start.md) for more details on authentication.
