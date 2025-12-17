<script setup lang="ts">
import {
  useAccount,
  useDisconnect,
  useSwitchChain,
  type Config,
  useConfig,
} from '@wagmi/vue';
import Address from './Address.vue';
import { ref } from 'vue';
import { getChainId } from '@wagmi/core';
import { useUserStore } from '@/stores/useUserStore';
import { useAppKit } from '@reown/appkit/vue';

const defaultChain = useDefaultChain();
const config = useConfig();
const { address, status, isDisconnected, isReconnecting, isConnecting } =
  useAccount({ config });
const { open } = useAppKit();
const { disconnect } = useDisconnect({ config });

const { chains, switchChain } = useSwitchChain({ config });
const chainId = getChainId(config as Config);

const isWrongNetwork = computed(
  () => !chains.value.some((chainItem) => chainItem.id === chainId)
);
const isOpen = ref(false);

const handleDisconnect = () => {
  disconnect();
  useUserStore().clearCache();
  isOpen.value = false;
};

watch([chainId, address], async ([newChainId, newAddress]) => {
  if (newAddress && newChainId !== defaultChain.value.id) {
    try {
      switchChain({ chainId: defaultChain.value.id });
    } catch (error) {
      console.error(`Failed to switch to ${defaultChain.value.name}:`, error);
    }
  }
});
</script>

<template>
  <div
    v-if="address"
    class="flex gap-3 items-center text-left cursor-pointer"
    @click="isOpen = true"
  >
    <Icon
      name="heroicons:user-circle"
      class="dark:text-cyan-100 w-8 h-8 ring ring-cyan-600 rounded-full relative bg-slate-200/50 dark:bg-transparent"
    />
    <div v-if="!isWrongNetwork" class="flex flex-col flex-wrap gap-1">
      <span class="dark:text-white text-xs uppercase">{{ status }}</span>
      <Address :address="address" />
    </div>
    <UButton v-else variant="outline" color="yellow">Wrong Network</UButton>
  </div>

  <UModal
    v-model="isOpen"
    :ui="{
      base: 'w-full md:w-max',
    }"
  >
    <UCard
      class="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full md:w-max"
    >
      <div class="flex flex-col gap-4">
        <div class="flex gap-2 items-center text-cyan-900 dark:text-cyan-100">
          <UIcon name="i-heroicons-power" class="w-[1.25rem] h-[1.25rem]" />
          <h4 class="text-lg font-semibold">Disconnect Wallet</h4>
        </div>
        <p
          class="text-start text-neutral-700 dark:text-neutral-300 max-w-[40ch] text-xs"
        >
          Disconnect manually or switch wallets on your extension to change
          wallet
        </p>

        <div class="grid grid-cols-2 gap-3 items-center">
          <UButton variant="outline" color="gray" @click="isOpen = false"
            >Cancel</UButton
          >
          <UButton variant="solid" color="red" @click="handleDisconnect"
            >Disconnect</UButton
          >
        </div>
      </div>
    </UCard>
  </UModal>

  <UButton
    v-if="isDisconnected"
    variant="outline"
    class="bg-neutral-100 ring-neutral-200 text-neutral-950 hover:bg-neutral-300 dark:bg-neutral-800/50 dark:ring-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-800/25"
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
