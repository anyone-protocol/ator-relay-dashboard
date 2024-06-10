<template>
  <NuxtLayout>
    <NuxtLoadingIndicator />
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { reconnect } from 'use-wagmi/actions';
import { mainnet, sepolia, hardhat } from 'use-wagmi/chains';
import { createWeb3Modal} from '@web3modal/wagmi/vue';
import {
  getAtorAddress,
  themeVariables,
} from '@/config/web3modal.config';
import { wagmiConfig } from '@/config/wagmi.config';

const chains = [mainnet, sepolia, hardhat];
const nuxtConfig = useRuntimeConfig();
const projectId = nuxtConfig.public.walletConnectProjectId;


createWeb3Modal({
  chains,
  tokens: {
    1: {
      address: getAtorAddress(),
      image: '/images/ator-logo.png',
    },
  },
  projectId,
  wagmiConfig: wagmiConfig,
  themeVariables,
});

onMounted(() => {
  void reconnect(wagmiConfig);
});
</script>
