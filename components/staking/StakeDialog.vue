<template>
  <UModal v-model="isOpen">
    <UCard
      class="bg-white dark:bg-neutral-900 rounded-lg shadow-lg relative ring-0"
    >
      <div class="flex gap-2 mb-2 pb-2">
        <Icon
          name="i-heroicons-chart-pie-20-solid"
          color="#24adc3"
          class="h-6 w-auto"
        ></Icon>

        <h4 class="text-lg font-semibold">Stake with operator:</h4>
      </div>
      <form @submit.prevent="handleSubmit" class="w-full md:w-auto">
        <UInput
          color="gray"
          variant="outline"
          class="mb-6"
          :disabled="true"
          :model-value="operator?.operator"
        />
        <div class="w-full flex flex-col items-end gap-1 mb-2">
          <span class="text-xs w-max"
            >Wallet:
            <span class="text-cyan-600 dark:text-cyan-300">
              {{ formatEtherNoRound(tokenBalance?.value || '0') }}
              <Ticker class="text-[9px]" />
            </span>
          </span>
          <span class="text-xs w-max"
            >Available:
            <span class="text-xs w-max text-cyan-600 dark:text-cyan-300">
              {{ formatEtherNoRound(hodlerInfo?.[0] || '0') }}
              <Ticker class="text-[9px]" />
            </span>
          </span>
        </div>
        <div class="flex flex-col gap-2">
          <div class="relative mb-1">
            <UInput
              :disabled="isSubmitting"
              v-model="stakeInput"
              color="neutral"
              placeholder="Amount to stake"
              min="0"
              @keypress="restrictKeypress($event)"
            />
            <UButton
              :disabled="!validateMaxStake()"
              @click="setMaxStake"
              size="2xs"
              variant="ghost"
              color="neutral"
              class="absolute right-2 top-1/2 -translate-y-1/2"
            >
              Max
            </UButton>
          </div>
          <span
            v-if="stakeMessage.text"
            class="text-xs"
            :class="{
              'text-cyan-600 dark:text-cyan-300':
                stakeMessage.type === 'info',
              'text-amber-600 dark:text-amber-300':
                stakeMessage.type === 'error',
            }"
          >
            {{ stakeMessage.text }}
          </span>
          <span
            v-else-if="lessThanMinimumStake"
            class="text-xs text-amber-600 dark:text-amber-300"
          >
            Less than minimum stake. You must stake at least 1 token.
          </span>
          <div class="flex justify-end gap-3 mt-5">
            <UButton
              size="xs"
              type="button"
              variant="outline"
              color="cyan"
              class="justify-center text-md"
              @click="isOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              :loading="isStaking"
              :disabled="isSubmitting || !isValidStakeInput()"
              type="submit"
              size="xs"
              variant="solid"
              color="cyan"
              class="justify-center text-md"
            >
              {{ isStaking ? 'Staking...' : 'Stake' }}
            </UButton>
          </div>
        </div>
      </form>
    </UCard>
  </UModal>
</template>

<script lang="ts" setup>
import { parseEther } from 'viem';
import BigNumber from 'bignumber.js';
import Ticker from '~/components/ui-kit/Ticker.vue';
import { isValidNumericInput } from '~/utils/validate';

interface Operator {
  operator: `0x${string}`;
  amount: bigint;
}

const props = defineProps<{
  open: boolean;
  operator: Operator | null;
  tokenBalance: any;
  hodlerInfo: any;
  isStaking: boolean;
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'stake', data: { amount: string; maxAmount: string }): void;
}>();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

const stakeInput = ref('');
const maxStakeAmount = ref('');

const stakeAmount = computed(() => validateTokenInput(stakeInput.value) || '0');

const stakeMessage = computed(() => {
  if (
    new BigNumber(stakeAmount.value).lt(1) ||
    !isValidNumericInput(stakeInput.value)
  )
    return { text: '', type: 'info' };

  const amount = new BigNumber(parseEther(stakeAmount.value).toString());
  const available = props.hodlerInfo?.[0]
    ? new BigNumber(props.hodlerInfo[0].toString())
    : new BigNumber(0);
  const walletBalance = props.tokenBalance?.value
    ? new BigNumber(props.tokenBalance.value.toString())
    : new BigNumber(0);

  if (amount.lte(available)) {
    return {
      text: `Using ${formatEtherNoRound(amount.toString())} tokens available in contract (max. ${formatEtherNoRound(available.toString())})`,
      type: 'info',
    };
  } else if (amount.lte(walletBalance)) {
    return {
      text: `Using ${formatEtherNoRound(amount.toString())} tokens from wallet (max. ${formatEtherNoRound(walletBalance.toString())})`,
      type: 'info',
    };
  } else {
    return {
      text: 'Chosen amount exceeds both contract and wallet balance.',
      type: 'error',
    };
  }
});

const validateMaxStake = () => {
  const available = props.hodlerInfo?.[0]
    ? new BigNumber(props.hodlerInfo[0].toString())
    : new BigNumber(0);
  const walletBalance = props.tokenBalance?.value
    ? new BigNumber(props.tokenBalance.value.toString())
    : new BigNumber(0);
  return available.gte(1) || walletBalance.gte(1);
};

const lessThanMinimumStake = computed(() => {
  if (!stakeAmount.value || stakeAmount.value === '0') return false;
  const amount = new BigNumber(parseEther(stakeAmount.value).toString());
  return amount.isLessThan(parseEther('1').toString());
});

const isValidStakeInput = () => {
  if (!stakeInput.value || !isValidNumericInput(stakeInput.value)) return false;

  const cleanedValue = stakeInput.value.replace(/,/g, '').trim();
  const amount = new BigNumber(parseEther(cleanedValue).toString());
  const walletBalance = props.tokenBalance?.value
    ? new BigNumber(props.tokenBalance.value.toString())
    : new BigNumber(0);

  const availableBalance = props.hodlerInfo?.[0]
    ? new BigNumber(props.hodlerInfo[0].toString())
    : new BigNumber(0);

  if (amount.isNaN()) return false;

  const formattedAmount = formatEtherNoRound(amount.toString());

  return (
    new BigNumber(formattedAmount).gte(1) &&
    (amount.lte(walletBalance) || amount.lte(availableBalance))
  );
};

const restrictKeypress = (event: KeyboardEvent) => {
  const allowedKeys = /[0-9.,]/;
  const input = event.target as HTMLInputElement;
  const value = input.value;
  // Prevent multiple decimals
  if (event.key === '.' && value.includes('.')) {
    event.preventDefault();
    return;
  }
  // Allow control keys (e.g., Backspace, Delete, Arrow keys)
  if (
    event.key.length === 1 && // Only check single-character keys
    !allowedKeys.test(event.key)
  ) {
    event.preventDefault();
  }
};

const setMaxStake = () => {
  const available = props.hodlerInfo?.[0]
    ? new BigNumber(props.hodlerInfo[0].toString())
    : new BigNumber(0);
  const walletBalance = props.tokenBalance?.value
    ? new BigNumber(props.tokenBalance.value.toString())
    : new BigNumber(0);

  const maxSource = available.gte(walletBalance) ? available : walletBalance;
  stakeInput.value = formatEtherNoRound(maxSource.toString());
  setTimeout(() => {
    maxStakeAmount.value = maxSource.toString();
  }, 50);
};

const handleSubmit = () => {
  emit('stake', {
    amount: stakeAmount.value,
    maxAmount: maxStakeAmount.value,
  });
};

watch(stakeInput, (value) => {
  if (value) {
    maxStakeAmount.value = '';
  }
});

watch(isOpen, (open) => {
  if (!open) {
    stakeInput.value = '';
    maxStakeAmount.value = '';
  }
});
</script>
