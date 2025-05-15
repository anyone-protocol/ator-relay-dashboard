import { WagmiPlugin } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(WagmiPlugin, { config });
});
