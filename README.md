# AnyOne Relay Dashboard

This repo houses the code to display the user specific information pertaining to ANYONE Relays.

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

## Resources

- https://cookbook.g8way.io/concepts/index.html

Bumpu~
