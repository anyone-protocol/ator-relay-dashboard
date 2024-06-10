<script setup lang="ts">
import { useWeb3Modal } from '@web3modal/wagmi/vue';
import { useAccount } from 'use-wagmi';
import { wagmiConfig } from '@/config/wagmi.config';
import Address from './Address.vue';

const { address, status, isDisconnected, isReconnecting, isConnecting } =
  useAccount({ config:wagmiConfig });

const { open } = useWeb3Modal();
const { disconnect } = useDisconnect({ config:wagmiConfig  });

const handleDisconnect = () => {
  disconnect();
};
</script>

<template>
  <div v-if="address" class="flex gap-3 items-center text-left cursor-pointer" @click="handleDisconnect">
    <Icon
      name="heroicons:user-circle"
      class="dark:text-cyan-100 w-8 h-8 ring ring-cyan-600 rounded-full relative bg-slate-200/50 dark:bg-transparent"
    />

    <div class="flex flex-col flex-wrap gap-1">
      <span class="dark:text-white text-xs uppercase">{{ status }}</span>
      <Address :address="address" />
    </div>
  </div>

  <UButton
    v-if="isDisconnected"
    variant="outline"
    @click="open({ view: 'Connect' })"
  >
    Connect wallet
  </UButton>

  <div
    v-if="isReconnecting || isConnecting"
    class="px-3 py-2"
    :aria-label="status"
  >
    <Icon name="eos-icons:three-dots-loading" class="dark:text-cyan-300" />
    <span class="sr-only">{{ status }}</span>
  </div>
</template>
