<template>
  <NuxtLayout>
    <NuxtLoadingIndicator />
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { createAppKit, type ChainAdapter } from '@reown/appkit/vue';
import { networks, networksLocal, wagmiAdapter } from './config/wagmi.config';
import { metadata } from '@/config/web3modal.config';

const nuxtConfig = useRuntimeConfig();
const projectId = nuxtConfig.public.walletConnectProjectId;
const phase = nuxtConfig.public.phase;

const selectedNetworks = phase === 'live' ? networks : networksLocal;

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
