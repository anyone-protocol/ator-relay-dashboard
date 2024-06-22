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
          content: 'ATOR Dashboard',
        },
        { property: 'og:site_name', content: 'ATOR Dashboard' },
        { name: 'twitter:site', content: '@atorprotocol' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/images/ator-logo.png',
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
      relayRegistryAddress: 'LYtr_ztHqd4nFFSZyYN9_BWIinESJNBVzOJwo1u5dU0',
      facilitatorContract: '0xC46E912231F1792830b8590d4fcA19d2Ac491ed4',
      sepoliaAtorTokenContract: '0xd90AAfacD4596FAF1cAD5423Bf838cCEc59ECac4',
      tokenContractMain: '0x0f7b3f5a8fed821c5eb60049538a548db2d479ce',
      distributionContract: 'ugUcnhSSpiW3TDHgBo0rLCL08HHZiqK9-ZHOmcJ7jLE',
      metricsDeployer: '53E8wWz8XkP9pGDQrgTi69GLAzZ6geX8bJckcifBr1Q',
      registratorContract: '0x525C31B35065540059701eE5feC12120F581E96e',
      warpGateway: 'https://gw.warp.cc/gateway/v2',
      githubNewIssueUrl:
        'https://github.com/ATOR-Development/ator-dashboard/issues/new',
      phase: 'dev',
      supportWalletPublicKeyBase64:
        'K3jnSGVyHj4kSzgce3+k8gJsfHvUoQeJMNPO8CcsO2s=',
      commitHash: process.env.NUXT_PUBLIC_COMMIT_HASH || 'dev',
      version: '1.0.2',
    },
  },
  plugins: [{ src: '~/plugins/vue-query.client.ts', mode: 'client' }],
});
