// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  ssr: false,

  imports: {
    dirs: ["./stores"],
  },

  nitro: {
    esbuild: {
      options: {
        target: "esnext",
      },
    },
  },

  modules: ["@nuxt/ui", "@pinia/nuxt"],

  // This is used instead on env file
  // See: https://nuxt.com/docs/guide/going-further/runtime-config
  runtimeConfig: {
    public: {
      walletConnectProjectId: "f5e29d36441ccd0e2f5e3473d5a2021b",
      warpContract: "53E8wWz8XkP9pGDQrgTi69GLAzZ6geX8bJckcifBr1Q",
      validatorContract: "53E8wWz8XkP9pGDQrgTi69GLAzZ6geX8bJckcifBr1Q",
    },
  },
});
