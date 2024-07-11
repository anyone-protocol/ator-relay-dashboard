<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAccount } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import Ticker from './ui-kit/Ticker.vue';

const userStore = useUserStore();
const { address, tokenBalance, tokenBalanceUsd } = storeToRefs(userStore);
const { isConnected } = useAccount({ config });

const { refresh: balanceRefresh, error: balanceError } = await useAsyncData(
  'balance',
  () => userStore.getTokenBalance().then(() => true),
  { watch: [address] }
);
const { refresh: balanceUsdRefresh, error: balanceUsdError } =
  await useAsyncData(
    'balanceUsd',
    () => userStore.getUsdTokenBalance().then(() => true),
    { watch: [address, tokenBalance] }
  );

// Get new data every 5 minutes
onMounted(() => {
  setInterval(
    () => {
      balanceRefresh();
      balanceUsdRefresh();
    },
    1000 * 60 * 5
  );
});

defineProps<{
  showTicker?: boolean;
}>();
</script>

<template>
  <ClientOnly>
    <div>
      <span class="text-4xl font-bold" v-if="isConnected">
        {{ parseFloat(tokenBalance.formatted).toFixed(2) }}
        <Ticker v-if="showTicker" />
      </span>

      <span class="text-4xl font-bold" v-if="!isConnected">
        --
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
