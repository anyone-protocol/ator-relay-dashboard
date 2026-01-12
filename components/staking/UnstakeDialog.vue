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

        <h4 class="text-lg font-semibold">Unstake from operator:</h4>
      </div>
      <form
        @submit.prevent="handleSubmit"
        class="mt-6 md:mt-0 w-full md:w-auto"
      >
        <UInput
          color="gray"
          variant="outline"
          class="mb-6"
          :disabled="true"
          :model-value="operator?.operator"
        />
        <div class="flex flex-col gap-2">
          <div class="text-neutral-400 text-sm">Amount to unstake:</div>
          <div class="relative">
            <UInput
              v-model="unstakeInput"
              color="neutral"
              placeholder="Amount to unstake"
              min="0"
              @keypress="restrictKeypress($event)"
            />
            <UButton
              @click="setMaxUnstake"
              size="2xs"
              variant="ghost"
              color="neutral"
              class="absolute right-2 top-1/2 -translate-y-1/2"
            >
              Max
            </UButton>
          </div>
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
              :disabled="!isValidUnstakeInput()"
              :loading="isUnstaking"
              type="submit"
              size="xs"
              variant="solid"
              color="cyan"
              class="justify-center text-md"
            >
              {{ isUnstaking ? 'Unstaking...' : 'Unstake' }}
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
import { isValidNumericInput } from '~/utils/validate';

interface Operator {
  operator: `0x${string}`;
  amount: bigint;
}

const props = defineProps<{
  open: boolean;
  operator: Operator | null;
  isUnstaking: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'unstake', data: { amount: string; maxAmount: bigint }): void;
}>();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

const unstakeInput = ref('');
const maxUnstakeAmount = ref<bigint>(0n);

const unstakeAmount = computed(
  () => validateTokenInput(unstakeInput.value) || '0'
);

const isValidUnstakeInput = () => {
  if (!unstakeInput.value || !isValidNumericInput(unstakeInput.value))
    return false;
  const cleanedValue = unstakeInput.value.replace(/,/g, '').trim();
  const amount = new BigNumber(parseEther(cleanedValue).toString());
  const stakedAmount = props.operator?.amount
    ? new BigNumber(props.operator.amount.toString())
    : new BigNumber(0);
  return amount.isGreaterThan(0) && amount.isLessThanOrEqualTo(stakedAmount);
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

const setMaxUnstake = () => {
  if (props.operator?.amount) {
    const amountStr = props.operator.amount.toString();
    const bigNumberValue = new BigNumber(amountStr);
    const etherValue = bigNumberValue.div(new BigNumber('1e18')); // Convert to Ether
    // Calculate decimals: adjust based on wei string length to show significant digits
    const decimals = Math.max(0, 18 - (amountStr.length - 1)); // Ensure non-negative
    const maxAmount = formatEtherNoRound(
      amountStr,
      etherValue.isZero() ? 2 : decimals
    );
    unstakeInput.value = maxAmount;
    setTimeout(() => {
      maxUnstakeAmount.value = props.operator?.amount || 0n;
    }, 50);
  }
};

const handleSubmit = () => {
  emit('unstake', {
    amount: unstakeAmount.value,
    maxAmount: maxUnstakeAmount.value,
  });
};

watch(unstakeInput, (value) => {
  if (value) {
    maxUnstakeAmount.value = 0n;
  }
});

watch(isOpen, (open) => {
  if (!open) {
    unstakeInput.value = '';
    maxUnstakeAmount.value = 0n;
  }
});
</script>
