import { fileURLToPath } from 'node:url';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { replaceCodePlugin } from './plugins/vite-plugin-replace';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,

  router: {
    options: {
      hashMode: true,
    },
  },

  app: {
    baseURL: '/',
    head: {
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'Description',
          content: 'ANYONE Dashboard',
        },
        { property: 'og:site_name', content: 'AnyOne Dashboard' },
        { name: 'twitter:site', content: '@AnyoneFDN' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/images/anyone-logo.png',
        },
      ],
    },
  },

  imports: {
    dirs: ['./stores'],
  },

  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
  },

  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxtjs/device', '@wagmi/vue/nuxt'],

  // This is used instead on env file
  // See: https://nuxt.com/docs/guide/going-further/runtime-config
  runtimeConfig: {
    public: {
      evmRpc: 'https://sepolia.gateway.tenderly.co',
      hyperbeamUrl: 'https://hb-stage.anyone.tech',
      // Hyperbeam PIDs — stage, batch deploy 2026-08-13. These change on every contract
      // redeploy: `deploy.ts` spawns a fresh process and writes the new id to Consul, so a
      // stale id here reads a process nobody is writing to any more (and the nginx edge
      // allowlist follows Consul, so it 403s rather than serving stale data).
      operatorRegistryHyperbeamProcessId:
        '2p2aXwksN1kLc_mbl2jWrfdmKw9tHD_PYR5-ZHWEPyc',
      relayRewardsHyperbeamProcessId:
        'utn6vNEgtyuZivk4gz-2tGWYWVPinJhYk4IDDdqLtUE',
      stakingRewardsHyperbeamProcessId:
        '41eqpwcMIyMhCAElq-M3jHMrMSTVENujZDJ09Vnd0nE',
      stakingSnapshotController: '6FyQki05iUsRdoY252dE4GlGItW4jpIr_t21VA3D6Zw',
      encryptedMessagesProcessId: '5TW6sze3xuYWBDHKmP19fAdgQhebuNZ0nV0NilOpX2Y',
      walletConnectProjectId: '53a5b087ab4cb303a799325360098216',
      relayRegistryAddress: 'ckFDH7CuiQQNj_Jes3lUDoQgT7Cuh76GEsOAl--T7P8',
      facilitatorContract: '0x88b1b22c890D986DF6A3D29f060ee539721E76C3',
      sepoliaAtorTokenContract: '0x3F7D7e1161B4CbC172517a2957A13814f4a657A2',
      atorTokenContract: '0xFeAc2Eae96899709a43E252B6B92971D32F9C0F9',
      tokenContractMain: '0xFeAc2Eae96899709a43E252B6B92971D32F9C0F9',
      distributionContract: '22rOD-_0isRZQaw0EBGh6Ko0ri5IPE7cYTaMThhPENk',
      metricsDeployer: '53E8wWz8XkP9pGDQrgTi69GLAzZ6geX8bJckcifBr1Q',
      registratorContract: '0xBaDEfC9bFdD8bAf78D948E4C9dB76734A056e2BD',
      hodlerContract: '0x853B73e080293CE696653cA466Ff2c3aAD92992f',
      distributionDeployer: 'G5tXjZS4SaMJNwOENZYgymvc6Zxp2Wws4Qf8wB0b-zA',
      warpGateway: 'https://gw.warp.cc/gateway/v2',
      centralizedMetricsAPI: 'https://api.ec.anyone.tech',
      dreNodeBaseUrl: 'https://dre.ec.anyone.tech',
      githubNewIssueUrl:
        'https://github.com/anyone-protocol/ator-relay-dashboard/issues/new',
      airdropApi:
        'https://wekxyorpeiwpxmexrwkx.supabase.co/rest/v1/Airdrops?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indla3h5b3JwZWl3cHhtZXhyd2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1NjExODMsImV4cCI6MjA0NDEzNzE4M30.9VZHP6g5dIwGYtT7LwXAGKGKirA9yhiPPCzPg5nlKug',
      variationApi:
        'https://wekxyorpeiwpxmexrwkx.supabase.co/rest/v1/Variation?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indla3h5b3JwZWl3cHhtZXhyd2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1NjExODMsImV4cCI6MjA0NDEzNzE4M30.9VZHP6g5dIwGYtT7LwXAGKGKirA9yhiPPCzPg5nlKug',
      phase: 'dev',
      supportWalletPublicKeyBase64:
        'K3jnSGVyHj4kSzgce3+k8gJsfHvUoQeJMNPO8CcsO2s=',
      commitHash: process.env.NUXT_PUBLIC_COMMIT_HASH || 'dev',
      version: '2.1.1',
      showMaintenanceBanner: false,
      showGovernanceCard: false,
    },
  },

  plugins: [{ src: '~/plugins/vue-query.client.ts', mode: 'client' }],

  vite: {
    resolve: {
      alias: {
        // We never use Vue/Nuxt devtools. pinia and vue-router import `setupDevtoolsPlugin`
        // unconditionally, and that import alone broke `pnpm dev` (Vite served the package's raw
        // CJS to the browser). Aliasing it to a no-op drops it from the client instead of pinning
        // a version that happens to ship ESM. See stubs/vue-devtools-api.ts.
        '@vue/devtools-api': fileURLToPath(
          new URL('./stubs/vue-devtools-api.ts', import.meta.url)
        ),
      },
    },
    server: {
      hmr: {
        host: 'localhost',
        clientPort: 3000,
      },
    },
    plugins: [
      nodePolyfills(),
      // NB: Fixes "exports not defined" when using arbundles -> crypto libs
      //     see https://github.com/davidmyersdev/vite-plugin-node-polyfills/issues/92#issuecomment-2228168969
      replaceCodePlugin({
        replacements: [
          {
            from: `if ((crypto && crypto.getRandomValues) || !process.browser) {
  exports.randomFill = randomFill
  exports.randomFillSync = randomFillSync
} else {
  exports.randomFill = oldBrowser
  exports.randomFillSync = oldBrowser
}`,
            to: `exports.randomFill = randomFill
exports.randomFillSync = randomFillSync`,
          },
        ],
      }),
    ],
  },

  compatibilityDate: '2025-10-30',
});
