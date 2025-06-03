<template>
  <div class="hidden lg:flex items-center gap-2 ml-auto mr-7">
    <div class="grid grid-rows-[1fr 2fr] border-l-2 border-cyan-600 pl-3">
      <span class="text-[9px] text-neutral-600 dark:text-neutral-300"
        >WALLET</span
      >
      <div class="inline-flex items-baseline gap-2">
        <template v-if="balancePending">
          <USkeleton class="w-full h-8" />
        </template>
        <template v-else>
          <div class="flex flex-col">
            <span class="text-lg leading-tight">
              <template v-if="isConnected">
                {{ formatEtherNoRound(tokenBalance.value) }}
              </template>
              <template v-else> -- </template>
            </span>
            <Ticker class="text-[9px] leading-tight" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '@/stores/useUserStore';
import { useAccount } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import Ticker from './ui-kit/Ticker.vue';

const { isConnected } = useAccount({ config } as any);

const userStore = useUserStore();
const { address, tokenBalance, tokenBalanceUsd } = storeToRefs(userStore);

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
