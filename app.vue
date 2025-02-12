<template>
  <NuxtLayout>
    <NuxtLoadingIndicator />
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
  import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/vue'

import { mainnet, sepolia } from 'viem/chains'
import { reconnect } from '@wagmi/core'
import { metadata } from '@/config/web3modal.config';
import {config} from '@/config/wagmi.config'
import { watchAccount } from '@wagmi/core'
import {switchChain} from '@wagmi/core'

const nuxtConfig = useRuntimeConfig();
const projectId = nuxtConfig.public.walletConnectProjectId;


reconnect(config)
// 3. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  metadata,
  defaultChain: sepolia,
})


// switchChain(config, { chainId: sepolia.id })
//   .then(() => console.log('Switched chain'))
//   .catch(err => console.error('Failed to switch chain:', err))

const unwatch = watchAccount(config, {
  onChange(account) { 
    // changed account
  },
})
unwatch()

</script>
