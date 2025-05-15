<script setup lang="ts">
import {
  useAccount,
  useDisconnect,
  useSwitchChain,
  type Config,
} from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import Address from './Address.vue';
import { ref } from 'vue';
import { getChainId } from '@wagmi/core';
import { useUserStore } from '@/stores/useUserStore';
import { useAppKit } from '@reown/appkit/vue';

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

  <UModal v-model="isOpen">
    <UCard class="bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
      <template #header>
        <h4 class="text-lg font-semibold">Account Options</h4>
      </template>

      <div>
        <UButton
          variant="outline"
          color="red"
          class="w-full"
          @click="handleDisconnect"
          >Disconnect</UButton
        >
      </div>

      <template #footer>
        <UButton variant="outline" class="w-full" @click="isOpen = false"
          >Close</UButton
        >
      </template>
    </UCard>
  </UModal>

  <UButton
    v-if="isDisconnected"
    variant="outline"
    class="lg:text-base ring-neutral-300 text-neutral-950 hover:bg-neutral-100/50 dark:ring-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-800/50"
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
