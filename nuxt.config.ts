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
      relayRegistryAddress: '1RDbSNnYEcZ_bK5WXuHOLm4izwf8H_U0CctMTK9FUws',
      facilitatorContract: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      sepoliaAtorTokenContract: '0x5D690a4C67925b5f73d405e59dda1425e1560fDf',
      registratorContract: '0xDB0cABef9e8DBbB9Dad6B1DB672f2EcCd425cE18',
      distributionContract: 'zOkPxTrRYVQ7IplTnEyTgt9iBDarhhWJjibm8UXI6Q0',
    },
  },
});
