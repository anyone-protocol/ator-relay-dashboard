// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

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
          content: 'ATOR Dashboard',
        },
        { property: 'og:site_name', content: 'ATOR Dashboard' },
        { name: 'twitter:site', content: '@atorprotocol' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/images/AtorLogo.png',
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

  modules: ['@nuxt/ui', '@pinia/nuxt', '@use-wagmi/nuxt'],

  // This is used instead on env file
  // See: https://nuxt.com/docs/guide/going-further/runtime-config
  runtimeConfig: {
    public: {
      walletConnectProjectId: 'f5e29d36441ccd0e2f5e3473d5a2021b',
      relayRegistryAddress: 'wcbR5hkhk1boUq0V5OLf38cM0qVs45m6kK4B6Ejfdf4',
      facilitatorContract: '0x21ad8F73c8E43C3cCf158AA2Af58cA19ed960fFF',
      sepoliaAtorTokenContract: '0xe0E527318Fe1644a368b4eA5AaCcBFB3FE8737B0',
      distributionContract: 'GeyCU06plVtWiudHxgXIu4863wwRByBmsP5AMBdhyj4',
      metricsDeployer: 'x0cuVieEDTFjtxI5m5i22u2IMr-WpBiTS-Vir8U3dbw',
      warpGateway: 'https://gw.warp.cc/gateway/v2',
      githubNewIssueUrl:
        'https://github.com/ATOR-Development/ator-dashboard/issues/new',
    },
  },
});
