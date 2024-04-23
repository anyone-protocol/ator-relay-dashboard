<script setup lang="ts">
import { storeToRefs } from "pinia";

const userStore = useUserStore();
const { address, tokenBalance, tokenBalanceUsd } = storeToRefs(userStore);

const { refresh: balanceRefresh, error: balanceError } = await useAsyncData(
  "balance", () => userStore.getTokenBalance().then(() => true), { watch: [address] }
);
const { refresh: balanceUsdRefresh, error: balanceUsdError } = await useAsyncData(
  "balanceUsd", () => userStore.getUsdTokenBalance().then(() => true), { watch: [address, tokenBalance] }
);

// Get new data every 5 minutes
onMounted(() => {
  setInterval(() => {
    balanceRefresh();
    balanceUsdRefresh();
  }, 1000 * 60 * 5);
})

defineProps<{
  showTicker?: boolean;
}>();
</script>

<template>
  <ClientOnly>
    <div>
      <span class="text-4xl font-bold" v-if="tokenBalance">
        {{ parseFloat(tokenBalance.formatted).toFixed(3) }}
        <Ticker v-if="showTicker" />
      </span>

      <span v-if="!tokenBalance?.formatted">
        0.00
        <Ticker v-if="showTicker" />
      </span>
      <slot></slot>
    </div>
    <p v-if="balanceUsdError" class="ml-1 mt-1 text-sm">
      <Icon name="iwwa:alert" class="h-4 w-4 text-red-500" />
      <span class="text-red-500 ml-1 text-xs">Error retrieving balance</span>
    </p>
    <p v-else class="ml-1 mt-1 text-sm">
      ~ ${{ tokenBalanceUsd.toFixed(2) }} USD
    </p>
  </ClientOnly>
</template>
