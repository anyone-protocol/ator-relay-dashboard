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
          content: 'ANON Dashboard',
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

  modules: ['@nuxt/ui', '@pinia/nuxt'],

  // This is used instead on env file
  // See: https://nuxt.com/docs/guide/going-further/runtime-config
  runtimeConfig: {
    public: {
      walletConnectProjectId: 'f5e29d36441ccd0e2f5e3473d5a2021b',
      relayRegistryAddress: 'DJgqT4QkuRQjtdDtWO6ofYBJI9nzTvphI-DTDyfJ7so',
      facilitatorContract: '0x45F6b9757B36697EFd37e98883894e98025E58a6',
      sepoliaAtorTokenContract: '0x3F7D7e1161B4CbC172517a2957A13814f4a657A2',
      tokenContractMain: '0x0f7b3f5a8fed821c5eb60049538a548db2d479ce',
      distributionContract: 'vjw3_Oj2DC6cFf-G6UXNm0Er99hIwA39BvOfv3SjRbs',
      metricsDeployer: 'x0cuVieEDTFjtxI5m5i22u2IMr-WpBiTS-Vir8U3dbw',
      registratorContract: '0xa7325b28ED397AC0391529425bB7d5C34dD4FD74',
      distributionDeployer: 'G5tXjZS4SaMJNwOENZYgymvc6Zxp2Wws4Qf8wB0b',
      warpGateway: 'https://gw.warp.cc/gateway/v2',
      githubNewIssueUrl:
        'https://github.com/anyone-protocol/ator-dashboard/issues/new',
      phase: 'dev',
      supportWalletPublicKeyBase64:
        'K3jnSGVyHj4kSzgce3+k8gJsfHvUoQeJMNPO8CcsO2s=',
      commitHash: process.env.NUXT_PUBLIC_COMMIT_HASH || 'dev',
      version: '1.1.7',
    },
  },
  plugins: [{ src: '~/plugins/vue-query.client.ts', mode: 'client' }],
});
