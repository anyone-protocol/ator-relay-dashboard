<template>
  <div
    class="hidden lg:grid grid-rows-[1fr 2fr] border-r-2 border-cyan-600 items-end pr-3 mr-3 h-full"
  >
    <span class="flex gap-1 items-center text-[9px] mb-auto"
      >CONTRACT
      <Popover
        placement="top"
        :arrow="false"
        class="h-max grid place-items-center"
      >
        <template #content>
          <span class="text-xs font-normal text-nowrap">
            Your total amount of tokens in the protocol: <br />
            <strong>Available</strong>, <strong>Locked</strong>,
            <strong>Staked</strong> and <strong>Vaulted</strong>.
          </span>
        </template>
        <template #trigger>
          <Icon name="heroicons:exclamation-circle" />
        </template>
      </Popover>
    </span>
    <div class="inline-flex items-baseline justify-end gap-2">
      <template v-if="isPending">
        <USkeleton class="w-full h-8" />
      </template>
      <template v-else>
        <div class="flex flex-col items-end">
          <span class="text-lg leading-tight">
            <template v-if="isConnected">
              {{ formatEtherNoRound(totalContract.toString() || '0') }}
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
import { hodlerAbi } from '../assets/abi/hodler';
import { useAccount, useReadContract } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import Ticker from './ui-kit/Ticker.vue';
import Popover from './ui-kit/Popover.vue';
import BigNumber from 'bignumber.js';

const runtimeConfig = useRuntimeConfig();
const { isConnected, address } = useAccount({ config } as any);
const userAddress = computed(() => address.value);
const hodlerContract = runtimeConfig.public.hodlerContract as `0x${string}`;

const totalVaulted = computed(() => {
  if (!vaultsData.value) return BigNumber(0);

  return vaultsData.value.reduce((acc, vault) => {
    const amount = new BigNumber(vault.amount.toString() || '0');
    return acc.plus(amount);
  }, new BigNumber(0));
});

const totalLocked = computed(() => {
  if (!locksData.value) return BigNumber(0);

  return locksData.value.reduce((acc, lock) => {
    const amount = new BigNumber(lock.amount.toString() || '0');
    return acc.plus(amount);
  }, new BigNumber(0));
});

const totalStaked = computed(() => {
  if (!stakesData.value) return BigNumber(0);

  return stakesData.value.reduce((acc, stake) => {
    const amount = new BigNumber(stake.amount.toString() || '0');
    return acc.plus(amount);
  }, new BigNumber(0));
});

const totalContract = computed(() => {
  if (!hodlerInfo.value) return BigNumber(0);

  const available = new BigNumber(hodlerInfo.value[0].toString() || '0');

  return available.plus(
    totalVaulted.value.plus(totalStaked.value).plus(totalLocked.value)
  );
});

const isPending = computed(() => {
  return (
    hodlerInfoPending.value ||
    vaultsPending.value ||
    locksPending.value ||
    stakesPending.value
  );
});

const {
  data: hodlerInfo,
  isPending: hodlerInfoPending,
  refetch: refetchHolderInfo,
} = useReadContract({
  address: hodlerContract,
  abi: hodlerAbi,
  functionName: 'hodlers',
  args: [userAddress.value as `0x${string}`],
  query: { enabled: true },
});

const {
  data: vaultsData,
  isPending: vaultsPending,
  refetch: refetchVaults,
} = useReadContract({
  address: hodlerContract,
  abi: hodlerAbi,
  functionName: 'getVaults',
  args: [userAddress.value as `0x${string}`],
  query: {
    enabled: computed(() => isConnected.value),
  },
});

const {
  data: stakesData,
  isLoading: stakesPending,
  error,
  refetch: refetchStakes,
} = useReadContract({
  address: hodlerContract,
  abi: hodlerAbi,
  functionName: 'getStakes',
  args: [userAddress.value as `0x${string}`],
  query: {
    enabled: !!userAddress.value,
  },
});

const { data: locksData, isPending: locksPending } = useReadContract({
  address: hodlerContract,
  abi: hodlerAbi,
  functionName: 'getLocks',
  args: [userAddress.value as `0x${string}`],
  query: {
    enabled: !!userAddress.value,
  },
});
</script>
