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
          hid: 'description',
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

  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxtjs/device'],

  // This is used instead on env file
  // See: https://nuxt.com/docs/guide/going-further/runtime-config
  runtimeConfig: {
    public: {
      encryptedMessagesProcessId: '5TW6sze3xuYWBDHKmP19fAdgQhebuNZ0nV0NilOpX2Y',
      walletConnectProjectId: 'f5e29d36441ccd0e2f5e3473d5a2021b',
      relayRegistryAddress: 'ckFDH7CuiQQNj_Jes3lUDoQgT7Cuh76GEsOAl--T7P8',
      facilitatorContract: '0xd5F13F38b3FeFEc9c3b9F4dE7D951084a3fFB89B',
      sepoliaAtorTokenContract: '0x3F7D7e1161B4CbC172517a2957A13814f4a657A2',
      tokenContractMain: '0xFeAc2Eae96899709a43E252B6B92971D32F9C0F9',
      distributionContract: '22rOD-_0isRZQaw0EBGh6Ko0ri5IPE7cYTaMThhPENk',
      metricsDeployer: '53E8wWz8XkP9pGDQrgTi69GLAzZ6geX8bJckcifBr1Q',
      registratorContract: '0x86e55b81cf6a86b9EFb630c0E6Ad91E53a509A35',
      distributionDeployer: 'G5tXjZS4SaMJNwOENZYgymvc6Zxp2Wws4Qf8wB0b',
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
      version: '1.5.7',
    },
  },
  plugins: [{ src: '~/plugins/vue-query.client.ts', mode: 'client' }],

  vite: {
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
});
