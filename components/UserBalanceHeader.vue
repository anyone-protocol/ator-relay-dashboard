<template>
  <div class="hidden lg:flex flex-col items-end pr-3">
    <span class="text-xs text-neutral-600 dark:text-neutral-200"
      >Account balance</span
    >
    <div class="inline-flex items-baseline gap-2">
      <template v-if="balancePending">
        <USkeleton class="w-[8rem] h-6" />
      </template>
      <template v-else>
        <div class="flex items-center gap-3">
          <span class="text-xl">
            <template v-if="isConnected">
              {{ formatEtherNoRound(tokenBalance.value) }}
            </template>
            <template v-else> -- </template>
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '@/stores/useUserStore';
import { useAccount } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';

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
