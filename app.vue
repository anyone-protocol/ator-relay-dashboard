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

createAppKit({
  adapters: [wagmiAdapter as ChainAdapter],
  networks: import.meta.dev ? networksLocal : networks,
  metadata,
  projectId,
  features: {
    connectMethodsOrder: ['wallet', 'email', 'social'],
  },
});
</script>
