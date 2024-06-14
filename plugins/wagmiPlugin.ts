import { WagmiPlugin } from '@wagmi/vue';
import { createApp } from 'vue';
import { config } from '@/config/wagmi.config';
import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  const app = createApp(nuxtApp.vueApp);
  app.use(WagmiPlugin, { config });
});
