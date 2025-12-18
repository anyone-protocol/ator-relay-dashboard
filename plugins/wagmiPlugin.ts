import { WagmiPlugin } from '@wagmi/vue';
import { createWagmiConfig } from '@/config/wagmi.config';
import { defineNuxtPlugin, useRuntimeConfig } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig();

  const { config } = createWagmiConfig({
    rpcUrl:
      runtimeConfig.public.evmRpc === 'default'
        ? undefined
        : runtimeConfig.public.evmRpc,
    phase: runtimeConfig.public.phase,
  });

  nuxtApp.vueApp.use(WagmiPlugin, { config });
});
