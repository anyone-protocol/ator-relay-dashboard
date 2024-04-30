<script setup lang="ts">
import { reconnect } from '@wagmi/core'
import { mainnet, sepolia } from 'viem/chains'
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/vue'
import { metadata, tokens, themeVariables } from "@/config/web3modal.config";

const chains = [mainnet, sepolia];
const nuxtConfig = useRuntimeConfig();
const projectId = nuxtConfig.public.walletConnectProjectId;

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata, ssr: false })

createWeb3Modal({
  chains,
  tokens,
  projectId,
  wagmiConfig,
  themeVariables,
});

onMounted(() => {
  reconnect(wagmiConfig)
})
</script>

<template>
  <NuxtLayout>
    <NuxtLoadingIndicator />
    <NuxtPage />
  </NuxtLayout>
</template>
