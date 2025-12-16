<template>
  <NuxtLayout>
    <NuxtLoadingIndicator />
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { createAppKit, type ChainAdapter } from '@reown/appkit/vue';
import { networks, createWagmiConfig } from './config/wagmi.config';
import { metadata } from '@/config/web3modal.config';

const nuxtConfig = useRuntimeConfig();
const projectId = nuxtConfig.public.walletConnectProjectId;
const phase = nuxtConfig.public.phase || 'dev';
const rpcUrl =
  nuxtConfig.public.evmRpc || 'https://sepolia.gateway.tenderly.co';

const selectedNetworks =
  phase === 'live' ? [networks[0]] : ([networks[1]] as any);

const { wagmiAdapter } = createWagmiConfig(rpcUrl, phase);

createAppKit({
  adapters: [wagmiAdapter as ChainAdapter],
  networks: selectedNetworks,
  metadata,
  projectId,
  features: {
    connectMethodsOrder: ['wallet', 'email', 'social'],
  },
});
</script>
