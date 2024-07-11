// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },

  ssr: false,

  app: {
    baseURL: '/',
    head: {
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid: 'description',
          name: 'Description',
          content: 'ANON Dashboard',
        },
        { property: 'og:site_name', content: 'AnyOne Dashboard' },
        { name: 'twitter:site', content: '@atorprotocol' },
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

  modules: ['@nuxt/ui', '@pinia/nuxt'],

  // This is used instead on env file
  // See: https://nuxt.com/docs/guide/going-further/runtime-config
  runtimeConfig: {
    public: {
      walletConnectProjectId: 'f5e29d36441ccd0e2f5e3473d5a2021b',
      relayRegistryAddress: 'qAKbvWizYxpZZiGKfo8Dy0qGfb6DuXBSgx2xLE-Zf7Y',
      facilitatorContract: '0xba55dfC8E60177e550316CA51711F23AF5161A42',
      sepoliaAtorTokenContract: '0x3F7D7e1161B4CbC172517a2957A13814f4a657A2',
      tokenContractMain: '0x0f7b3f5a8fed821c5eb60049538a548db2d479ce',
      distributionContract: 'VK7smaaSFuh2WN7uK02JfJat8cMu_ju6ax2n_nQ3wTU',
      metricsDeployer: '53E8wWz8XkP9pGDQrgTi69GLAzZ6geX8bJckcifBr1Q',
      registratorContract: '0xa7325b28ED397AC0391529425bB7d5C34dD4FD74',
      warpGateway: 'https://gw.warp.cc/gateway/v2',
      githubNewIssueUrl:
        'https://github.com/ATOR-Development/ator-dashboard/issues/new',
      phase: 'dev',
      supportWalletPublicKeyBase64:
        'K3jnSGVyHj4kSzgce3+k8gJsfHvUoQeJMNPO8CcsO2s=',
      commitHash: process.env.NUXT_PUBLIC_COMMIT_HASH || 'dev',
      version: '1.0.5',
    },
  },
  plugins: [{ src: '~/plugins/vue-query.client.ts', mode: 'client' }],
});
