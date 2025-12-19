import { WagmiPlugin } from '@wagmi/vue';
import { createWagmiConfig } from '@/config/wagmi.config';
import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  const { config } = createWagmiConfig();

  nuxtApp.vueApp.use(WagmiPlugin, { config });
});
