<template>
  <div
    class="hidden lg:grid grid-rows-[1fr 2fr] border-r-2 border-cyan-600 items-end pr-3 mr-3 h-full"
  >
    <p class="justify-self-end text-[9px] mb-auto">WALLET</p>
    <div class="inline-flex items-baseline justify-end gap-2">
      <template v-if="isConnected && tokenBalancePending">
        <div class="flex flex-col items-end gap-1">
          <USkeleton class="w-20 h-6" />
          <USkeleton class="w-14 h-4" />
        </div>
      </template>
      <template v-else>
        <div class="flex flex-col items-end">
          <span class="text-lg leading-tight">
            <template v-if="isConnected">
              {{ formatEtherNoRound(tokenBalance?.value.toString() || '0') }}
            </template>
            <template v-else> -- </template>
          </span>
          <Ticker class="text-[9px] leading-tight" />
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAccount, useBalance, useConfig } from '@wagmi/vue';
import Ticker from './ui-kit/Ticker.vue';
import { getChainId } from '@wagmi/core';

const runtimeConfig = useRuntimeConfig();
const config = useConfig();
const { isConnected, address } = useAccount();
const hodlerContract = runtimeConfig.public.hodlerContract as `0x${string}`;
const chainId = getChainId(config);

const tokenContract = runtimeConfig.public.phase === 'live'
  ? runtimeConfig.public.atorTokenContract as `0x${string}`
  : runtimeConfig.public.sepoliaAtorTokenContract as `0x${string}`;

const {
  data: tokenBalance,
  isPending: tokenBalancePending,
  error: tokenBalanceError,
} = useBalance({
  address: computed(() => address.value),
  // need to confirm whether to set dynamically or use only mainnet
  chainId: chainId,
  token: tokenContract,
  query: {
    enabled: computed(() => !!address.value && isConnected.value),
  },
});
watch(tokenBalanceError, (newError) => {
  if (newError) {
    console.error('Error fetching token balance:', newError);
  }
});
</script>
