# Build and deploy

## Phases

| Phase | Job spec | Contracts read | `PHASE` |
| --- | --- | --- | --- |
| dev | `operations/deploy-relay-dashboard-dev.hcl` | stage | `dev` |
| stage | `operations/deploy-relay-dashboard-stage.hcl` | stage | `stage` |
| prelive | `operations/deploy-relay-dashboard-prelive.hcl` | live | `live` |
| live | `operations/deploy-relay-dashboard-live.hcl` | live | `live` |

- dev reads the stage contracts, so it points at the stage HyperBEAM node. The process ids it
  uses exist on that node only.
- prelive reads the same Consul keys as live and differs from live in the bucket it syncs to.
  It is where the live configuration is checked before release.

## Runtime configuration

Nuxt maps an environment variable named `NUXT_PUBLIC_FOO_BAR` onto `runtimeConfig.public.fooBar`.

- A variable whose name matches no key is ignored, and the default in `nuxt.config.ts` stays in
  place. A renamed key needs the same rename in every job spec.
- consul-template renders a missing Consul key as an empty string.
- The defaults in `nuxt.config.ts` point at stage. Only local builds use them, because every
  deployed phase takes its values from Consul.
- The process id defaults change whenever the stage contracts are redeployed. Update them by
  hand after a redeploy.

The process id variables carry `_HYPERBEAM_` in their names:

| Variable | Consul key |
| --- | --- |
| `NUXT_PUBLIC_OPERATOR_REGISTRY_HYPERBEAM_PROCESS_ID` | `smart-contracts/<env>/operator-registry-address` |
| `NUXT_PUBLIC_RELAY_REWARDS_HYPERBEAM_PROCESS_ID` | `smart-contracts/<env>/relay-rewards-address` |
| `NUXT_PUBLIC_STAKING_REWARDS_HYPERBEAM_PROCESS_ID` | `smart-contracts/<env>/staking-rewards-address` |

## Live build check

`nuxt.config.ts` refuses to build when the phase is `live` and the configuration is incomplete.
The phase is read from `NUXT_PUBLIC_PHASE`, then from `PHASE`. The check applies to prelive and
live. It requires:

- each of these to be set and non-empty:
  - `NUXT_PUBLIC_OPERATOR_REGISTRY_HYPERBEAM_PROCESS_ID`
  - `NUXT_PUBLIC_RELAY_REWARDS_HYPERBEAM_PROCESS_ID`
  - `NUXT_PUBLIC_STAKING_REWARDS_HYPERBEAM_PROCESS_ID`
  - `NUXT_PUBLIC_HYPERBEAM_URL`
  - `NUXT_PUBLIC_HODLER_CONTRACT`
  - `NUXT_PUBLIC_ATOR_TOKEN_CONTRACT`
- `NUXT_PUBLIC_HYPERBEAM_URL` to be a valid URL whose host is `hb.anyone.tech`.

Without the check, a live build with a missing value would fall back to the stage defaults.

## Package manager

Use pnpm 11.21.0. `packageManager` in `package.json` and the `Dockerfile` both pin it, so local
installs and image builds resolve dependencies the same way.

After any change to dependencies, review the lockfile diff and build the image before merging.

### `pnpm-workspace.yaml`

`allowBuilds` lists the packages that may run build scripts.

- `@anyone-protocol/ao-client` is a git dependency with a `prepare` script, so pnpm requires it
  to be listed.
- Its key is the fully resolved specifier, including the commit that the pinned tag resolves
  to. List it once, under that key only. After pinning a new `ao-client` tag, update the key to
  match the resolution in `pnpm-lock.yaml`.
- The optional native builds are off. The packages fall back to JavaScript.

`overrides` holds the dependency overrides. pnpm reads them from this file and ignores
`pnpm.overrides` in `package.json`.

- Bound every override to one major version, for example `>=8.21.0 <9`.
- Build the image after adding an override.

## Vite

- `@vue/devtools-api` is aliased to [`stubs/vue-devtools-api.ts`](../stubs/vue-devtools-api.ts),
  a no-op. The dashboard does not use the devtools, and pinia and vue-router import the package
  unconditionally.
- `vite-plugin-node-polyfills` provides the Node globals that `arbundles` and its crypto
  dependencies expect in the browser.

## Release workflow

[`deploy.yml`](../.github/workflows/deploy.yml) builds the image, pushes it tagged by commit
SHA, and deploys one phase:

| Trigger | Phase |
| --- | --- |
| Push to `main` | stage |
| Push to a `dev_*` branch | dev |
| Push of a `v*` tag | live |
| Manual run | The phase chosen in the `phase` input |

Each job spec builds the static site and syncs it to a Cloudflare R2 bucket.
