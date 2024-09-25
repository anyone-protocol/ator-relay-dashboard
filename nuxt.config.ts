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
      relayRegistryAddress: 'soNHpTqa2LCXjt-TQ1owmaTMeEJqa3cTyvJtsGyXqv8',
      facilitatorContract: '0xF248C1ea13a787037E2BCBbAfc42bde920B84D07',
      sepoliaAtorTokenContract: '0x3F7D7e1161B4CbC172517a2957A13814f4a657A2',
      tokenContractMain: '0x0f7b3f5a8fed821c5eb60049538a548db2d479ce',
      distributionContract: '3a4pE8sSmmp2MdkOzVS6cc-PgYnwgSSEmFN8MW7_w50',
      metricsDeployer: 'x0cuVieEDTFjtxI5m5i22u2IMr-WpBiTS-Vir8U3dbw',
      registratorContract: '0xc148c615b87e63Dcc90e55d53B44172503cCe889',
      distributionDeployer: 'G5tXjZS4SaMJNwOENZYgymvc6Zxp2Wws4Qf8wB0b',
      warpGateway: 'https://gw.warp.cc/gateway/v2',
      githubNewIssueUrl:
        'https://github.com/anyone-protocol/ator-relay-dashboard/issues/new',
      phase: 'dev',
      supportWalletPublicKeyBase64:
        'K3jnSGVyHj4kSzgce3+k8gJsfHvUoQeJMNPO8CcsO2s=',
      commitHash: process.env.NUXT_PUBLIC_COMMIT_HASH || 'dev',
      version: '1.2.2',
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
