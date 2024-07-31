<template>
  <ClientOnly>
    <div class="inline-flex items-baseline gap-2 w-[20rem]">
      <template v-if="balancePending || balanceUsdPending">
        <USkeleton class="w-[15rem] h-10" />
      </template>
      <template v-else>
        <span class="text-4xl font-bold" v-if="isConnected">
          {{ parseFloat(tokenBalance.formatted).toFixed(2) }}
        </span>
        <span class="text-4xl font-bold" v-if="!isConnected"> -- </span>
        <Ticker v-if="showTicker" />
        <slot></slot>
      </template>
    </div>
    <p v-if="balanceUsdError" class="ml-1 mt-1 text-sm">
      <Icon name="iwwa:alert" class="h-4 w-4 text-red-500" />
      <span class="text-red-500 ml-1 text-xs">Error retrieving balance</span>
    </p>
    <template v-else>
      <template v-if="balancePending || balanceUsdPending">
        <USkeleton class="w-[6rem] h-4" />
      </template>
      <template v-else>
        <p class="ml-1 mt-1 text-sm">~ ${{ tokenBalanceUsd.toFixed(2) }} USD</p>
      </template>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAccount } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import Ticker from './ui-kit/Ticker.vue';
import { useUserStore } from '@/stores/useUserStore';
import { watchAccount } from '@wagmi/core';

const userStore = useUserStore();
const { address, tokenBalance, tokenBalanceUsd } = storeToRefs(userStore);
const { isConnected } = useAccount({ config } as any);

const balancePending = ref(false);
const balanceUsdPending = ref(false);
const balanceError = ref(null as any);
const balanceUsdError = ref(null as any);

const fetchBalances = async (forceRefresh = false) => {
  try {
    balancePending.value = true;

    await userStore.getTokenBalance(forceRefresh);
    balancePending.value = false;
  } catch (error) {
    balanceError.value = error;
  }

  try {
    balanceUsdPending.value = true;
    await userStore.getUsdTokenBalance(forceRefresh);
    balanceUsdPending.value = false;
  } catch (error) {
    balanceUsdError.value = error;
  }
};

watch(
  () => userStore.userData.address,
  async (newAddress?: string) => {
    if (newAddress) {
      console.log('new address', newAddress);
      fetchBalances(true);
    }
  }
);

onMounted(() => {
  fetchBalances();
  setInterval(fetchBalances, 1000 * 60 * 5);
});

defineProps<{
  showTicker?: boolean;
}>();
</script>
