# ATOR Relay Dashboard (WIP)

This repo houses the code to display the user specific information pertaining to ATOR Relays.

## To Do

Since this is in progress, there is still work to be done.
While this list seems long much of the boilerplate exists.

- Get claimable rewards total (hardcoded now)
- Get previously claimed to date (hardcoded now)
- Get reward history per user and plot a graph (empty array now)
- We need to implement signing for the functions - see below.
- Register, Claim and Renounce functions need to be tested (need mock data)
- We need decent mock data to test properly

## Background

This is actually the third iteration of this code:

1. ATOR built: https://github.com/ATOR-Development/ator-dashboard/
2. Brewlabs built: https://github.com/brewlabs-code/ator/
3. Brewlabs built stripped down: https://github.com/brewlabs-code/ator-relay-dashboard

For reasons not worth getting into now ATOR changed directions technically. As such the 2nd build was halted.
Now, the underlying tech has changed somewhat and we are developing an MVP version focussing on the user account section.
Much of the code has been migrated but also some updates where necessary.

## Tech used

While there is a bunch of other packages installed some worth pointing out are:

- Nuxt (Vue)
- Pinia for storage
- Nuxt UI + Tailwind
- Wagmi core
- Web3Modal (wallet connection)
- Warp SDK to interrogate Arwaeve
- Viem (instead of Ethers)

See the `package.json` for more.

## Setup

Make sure to install the dependencies:

```bash
# pnpm
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# pnpm
pnpm run dev
```

## Production

Build the application for production:

```bash
# pnpm
pnpm run generate
```

Locally preview production build:

```bash
# pnpm
pnpm run preview
```

## Development concepts

### Storage

Data is stored on chain using Arweave - this means it's permanent.

Locally or in the app, the data is stored using Pinia.

### Getting data

For the most part data is fetched using Nuxt's `useAsyncData`.
See https://nuxt.com/docs/getting-started/data-fetching

Often, but not always, the results are stored in a Pinia state store.
Alongside the store there are actions to retrieve the data, these actions or functions are called by `useAsyncData`, this means we can easily refresh, cache and manage the data.

#### To get relay data per user we do something like this:

- Using the Warp SDK we can get the contracts state.
- Namely we want to get `verified` and `claimable` data.
- This returns a list of relay fingerprints and associated addresses, stored in Pinia as a Getter.
- The data is fetched here, `components\DataTableMyRelays.vue`, but stored in Pinia.
- Since this only gives us relay fingerprints, we make an additional request to Arweave (using ARDB) `stores\useMetricsStore.ts`.
- That gives use transaction data, namely the latest transaction ID.
- We use that to retrieve relay meta in JSON format for ALL relays.
- Then we need to map it to the existing fingerprints we retrieved earlier and display in the table.

## Resources

- https://cookbook.g8way.io/concepts/index.html
- http://arweave.net/bKdUd6vonjrZS4-FUGMPr5ecOeF405pR2DdO_at1D9I (example of Arweave JSON data)
