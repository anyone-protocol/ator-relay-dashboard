<template>
  <div
    class="hidden lg:grid grid-rows-[1fr 2fr] border-r-2 border-cyan-600 items-end pr-3 mr-3 h-full"
  >
    <p class="justify-self-end text-[9px] mb-auto">WALLET</p>
    <div class="inline-flex items-baseline justify-end gap-2">
      <template v-if="tokenBalancePending">
        <USkeleton class="w-full h-8" />
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
import { useAccount, useBalance } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import Ticker from './ui-kit/Ticker.vue';
import { getChainId } from '@wagmi/core';

const runtimeConfig = useRuntimeConfig();
const { isConnected, address } = useAccount({ config } as any);
const userAddress = computed(() => address.value);
const hodlerContract = runtimeConfig.public.hodlerContract as `0x${string}`;

const chainId = getChainId(config);

const tokenContract = runtimeConfig.public
  .sepoliaAtorTokenContract as `0x${string}`;

const { data: tokenBalance, isPending: tokenBalancePending } = useBalance({
  address: address.value,
  // need to confirm whether to set dynamically or use only mainnet
  chainId: chainId,
  token: tokenContract,
  query: {
    enabled: computed(() => !!address.value),
  },
});
</script>
