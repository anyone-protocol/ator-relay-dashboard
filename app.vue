<script setup lang="ts">
import { reconnect } from 'use-wagmi/actions';
import { mainnet, sepolia } from 'use-wagmi/chains';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/vue';
import {
  metadata,
  getAtorAddress,
  themeVariables,
} from '@/config/web3modal.config';

const chains = [mainnet, sepolia];
const nuxtConfig = useRuntimeConfig();
const projectId = nuxtConfig.public.walletConnectProjectId;

const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: false,
});

createWeb3Modal({
  chains,
  tokens: {
    1: {
      address: getAtorAddress(),
      image: '/images/ator-logo.png',
    },
  },
  projectId,
  wagmiConfig,
  themeVariables,
});

onMounted(() => {
  reconnect(wagmiConfig);
});
</script>

<template>
  <NuxtLayout>
    <NuxtLoadingIndicator />
    <NuxtPage />
  </NuxtLayout>
</template>
