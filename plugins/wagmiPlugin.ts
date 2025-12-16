import { WagmiPlugin } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig();

  nuxtApp.vueApp.use(WagmiPlugin, {
    config:
      runtimeConfig.public.phase === 'live' ? config.sepolia : config.mainnet,
  });
});
