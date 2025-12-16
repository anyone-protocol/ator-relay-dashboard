import { WagmiPlugin } from '@wagmi/vue';
import { createWagmiConfig } from '@/config/wagmi.config';
import { defineNuxtPlugin, useRuntimeConfig } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig();
  const phase = runtimeConfig.public.phase || 'dev';
  const rpcUrl =
    runtimeConfig.public.evmRpc || 'https://sepolia.gateway.tenderly.co';

  const { config } = createWagmiConfig(rpcUrl, phase);

  nuxtApp.vueApp.use(WagmiPlugin, { config });
});
