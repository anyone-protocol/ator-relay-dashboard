<template>
  <div class="hidden lg:grid grid-rows-[1fr 2fr] items-end pr-3 h-full">
    <span class="text-[9px] text-neutral-600 dark:text-neutral-300 mb-auto"
      >AVAILABLE</span
    >
    <div class="inline-flex items-baseline gap-2">
      <template v-if="hodlerInfoPending">
        <USkeleton class="w-full h-8" />
      </template>
      <template v-else>
        <div class="flex flex-col items-end">
          <span class="text-lg leading-tight">
            <template v-if="isConnected">
              {{ formatEtherNoRound(hodlerInfo?.[0] || '0') }}
            </template>
            <template v-else> -- </template>
          </span>
          <Ticker class="text-[9px] leading-tight" />
          <!-- <UButton
              :disabled="!isConnected || Number(hodlerInfo?.[0]) <= 0"
              variant="outline"
              color="cyan"
              size="2xs"
              class="h-max"
            >
              Withdraw
            </UButton> -->
        </div>
      </template>
    </div>
  </div>

  <UModal v-model="withdrawDialogOpen">
    <UCard
      class="bg-white dark:bg-neutral-900 rounded-lg shadow-lg relative ring-0"
    >
      <h4 class="text-lg font-semibold mb-6">Withdraw tokens</h4>
      <form
        @submit.prevent="submitWithdrawForm"
        class="mt-6 md:mt-0 w-full md:w-auto"
      >
        <label for="withdrawAmount" class="text-sm">Amount to withdraw: </label>
        <UInput
          :disabled="isWithdrawing"
          name="withdrawAmount"
          class="mt-2 mb-6"
          v-model="withdrawAmount"
          color="neutral"
          placeholder="Withdraw amount"
          type="number"
          min="0"
        />
        <div class="flex justify-end gap-3">
          <UButton variant="outline" color="cyan" @click="[handleClose]">
            Cancel
          </UButton>
          <UButton
            :disabled="withdrawAmount <= 0"
            :loading="isWithdrawing"
            variant="solid"
            color="cyan"
            type="submit"
          >
            {{ isWithdrawing ? 'Withdrawing...' : 'Withdraw' }}
          </UButton>
        </div>
      </form>
    </UCard>
  </UModal>
</template>

<script lang="ts" setup>
import { hodlerAbi } from '../assets/abi/hodler';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import { parseEther } from 'viem';
import Ticker from './ui-kit/Ticker.vue';

const toast = useToast();
const runtimeConfig = useRuntimeConfig();
const { data: hash, isPending, writeContractAsync } = useWriteContract();
const { isLoading: isConfirming, isSuccess: isConfirmed } =
  useWaitForTransactionReceipt({
    hash,
  });
const { isConnected, address } = useAccount({ config } as any);
const userAddress = computed(() => address.value);
const hodlerContract = runtimeConfig.public.hodlerContract as `0x${string}`;
const withdrawAmount = ref(0);
const withdrawDialogOpen = ref(false);
const isWithdrawing = computed(() => isPending.value || isConfirming.value);

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

const handleClose = () => {
  if (isWithdrawing) {
    toast.add({
      id: 'withdraw',
      title: `Withdrawing ${withdrawAmount.value} tokens...`,
      color: 'blue',
      timeout: 0,
    });
  }
};

const submitWithdrawForm = async () => {
  if (!isConnected) {
    toast.add({
      title: 'Please connect your wallet to withdraw',
      color: 'red',
    });
    return;
  }

  // console.log('withdraw amount: ', withdrawAmount.value);

  if (!withdrawAmount.value || Number(withdrawAmount.value) <= 0) {
    toast.add({
      title: 'Enter a valid withdraw amount',
      color: 'red',
    });
    return;
  }

  try {
    // console.log('withdrawing...');
    const amount = parseEther(withdrawAmount.value.toString());

    await writeContractAsync({
      address: hodlerContract,
      abi: hodlerAbi,
      functionName: 'withdraw',
      args: [amount],
    });
  } catch (error) {
    toast.remove('withdraw');
    console.error('WithdrawError: ', error);
    toast.add({
      title: 'Failed to withdraw tokens',
      color: 'red',
    });
  }
};

watch(isConfirmed, (confirmed) => {
  if (confirmed) {
    toast.remove('withdraw');
    toast.add({
      title: `Withdrew ${withdrawAmount.value} tokens`,
      color: 'green',
    });
    withdrawAmount.value = 0;
    withdrawDialogOpen.value = false;
    refetchHolderInfo();
  }
});
</script>
