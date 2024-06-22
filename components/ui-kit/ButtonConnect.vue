<script setup lang="ts">
import { useWeb3Modal } from '@web3modal/wagmi/vue';
import { useAccount, useDisconnect, useSwitchChain } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import Address from './Address.vue';
import { ref } from 'vue';
import { getChainId } from '@wagmi/core'


const { address, status, isDisconnected, isReconnecting, isConnecting } = useAccount({ config });
const { open } = useWeb3Modal();
const { disconnect } = useDisconnect({ config });

const handleDisconnect = () => {
  disconnect();
};

const { chains, switchChain } = useSwitchChain({ config });
const chainId = getChainId(config)

const isWrongNetwork = computed(() => !chains.value.some((chainItem) => chainItem.id === chainId));
const isOpen = ref(false);
</script>

<template>
  <div v-if="address" class="flex gap-3 items-center text-left cursor-pointer" @click="isOpen = true">
    <Icon name="heroicons:user-circle"
      class="dark:text-cyan-100 w-8 h-8 ring ring-cyan-600 rounded-full relative bg-slate-200/50 dark:bg-transparent" />
    <div v-if="!isWrongNetwork" class="flex flex-col flex-wrap gap-1">
      <span class="dark:text-white text-xs uppercase">{{ status }}</span>
      <Address :address="address" />
    </div>
    <UButton v-else variant="outline" color="yellow">Wrong Network</UButton>
  </div>


  <UModal v-model="isOpen">
    <UCard class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <template #header>
        <h4 class="text-lg font-semibold mb-4">Account Options</h4>
      </template>

      <div class="space-y-4">
        <UButton variant="outline" color="red" class="w-full" @click="handleDisconnect">Disconnect</UButton>

        <div>
          <h5 class="text-sm font-medium mb-2">Switch Network</h5>
          <div class="space-y-2">
            <UButton v-for="chainItem in chains" :key="chainItem.id" class="w-full" variant="outline"
              :class="{ 'opacity-50 cursor-not-allowed': chainId === chainItem.id }"
              @click="switchChain({ chainId: chainItem.id })" :disabled="chainId === chainItem.id">
              {{ chainItem.name }} <span v-if="chainId === chainItem.id" class="ml-2">(Connected)</span>
            </UButton>
          </div>
        </div>
      </div>

      <template #footer>
        <UButton variant="outline" class="mt-4 w-full" @click="isOpen = false">Close</UButton>
      </template>
    </UCard>
  </UModal>

  <UButton v-if="isDisconnected" variant="outline" @click="open({ view: 'Connect' })">
    Connect wallet
  </UButton>

  <div v-if="isReconnecting || isConnecting" class="px-3 py-2" :aria-label="status">
    <Icon name="eos-icons:three-dots-loading" class="dark:text-cyan-300" />
    <span class="sr-only">{{ status }}</span>
  </div>
</template>
