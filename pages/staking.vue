<template>
  <Card>
    <div class="flex items-center space-x-2 mb-6">
      <Icon name="dashicons:chart-pie" class="text-2xl" />
      <h2 class="text-2xl">Staking</h2>
    </div>
    <UTabs
      :items="items"
      :ui="{
        list: {
          width: 'w-max',
          background: '',
          marker: {
            background: '',
          },
          tab: {
            base: 'pb-2 px-4 text-white font-medium',
            rounded: 'rounded-none',
            background: '',
            active: 'border-b-2 border-cyan-500',
          },
        },
      }"
    >
      <template v-slot:operators="{ item }">
        <UTable
          :empty-state="{
            icon: 'i-heroicons-circle-stack-20-solid',
            label: 'No operators.',
          }"
          :columns="columns"
          :rows="operators"
        >
          <template #actions-data="{ row }">
            <UDropdown :items="operatorActionItems(row)">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-ellipsis-horizontal-20-solid"
              />
            </UDropdown>
          </template>
        </UTable>

        <!-- Stake dialog -->
        <UModal v-model="stakeDialogOpen">
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
            <form @submit.prevent="submitStakeForm" class="w-full md:w-auto">
              <UInput
                class="mb-6"
                :disabled="true"
                :model-value="selectedOperator?.operator"
              />
              <div class="flex flex-col gap-2">
                <div class="text-gray-400">Amount to stake:</div>
                <UInput
                  v-model="stakeAmount"
                  color="neutral"
                  placeholder="Amount to stake"
                  type="number"
                  min="0"
                />
                <div class="flex justify-end gap-3 mt-5">
                  <UButton
                    size="xs"
                    @click="[(stakeAmount = 0), (stakeDialogOpen = false)]"
                    type="button"
                    variant="outline"
                    color="cyan"
                    class="justify-center text-md"
                  >
                    Cancel
                  </UButton>
                  <UButton
                    :loading="isSubmitting.value"
                    :disabled="!stakeAmount"
                    type="submit"
                    size="xs"
                    variant="solid"
                    color="cyan"
                    class="justify-center text-md"
                  >
                    {{ isPending ? 'Staking' : 'Stake' }}
                  </UButton>
                </div>
              </div>
            </form>
          </UCard>
        </UModal>

        <!-- Unstake dialog -->
        <UModal v-model="unstakeDialogOpen">
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
              @submit.prevent="submitUnstakeForm"
              class="mt-6 md:mt-0 w-full md:w-auto"
            >
              <!-- <div class="text-gray-400 mb-2">Staking with operator:</div> -->
              <UInput
                class="mb-6"
                :disabled="true"
                :model-value="selectedOperator?.operator"
              />
              <div class="flex flex-col gap-2">
                <div class="text-gray-400">Amount to unstake:</div>
                <UInput
                  v-model="unstakeAmount"
                  color="neutral"
                  placeholder="Amount to unstake"
                  type="number"
                  min="0"
                />
                <div class="flex justify-end gap-3 mt-5">
                  <UButton
                    size="xs"
                    @click="[(unstakeAmount = 0), (unstakeDialogOpen = false)]"
                    type="button"
                    variant="outline"
                    color="cyan"
                    class="justify-center text-md"
                  >
                    Cancel
                  </UButton>
                  <UButton
                    :disabled="!unstakeAmount"
                    :loading="isSubmitting.value"
                    type="submit"
                    size="xs"
                    variant="solid"
                    color="cyan"
                    class="justify-center text-md"
                  >
                    {{ isPending ? 'Unstaking' : 'Unstake' }}
                  </UButton>
                </div>
              </div>
            </form>
          </UCard>
        </UModal>
      </template>
      <template #vault="{ item }">
        <p>{{ item.label }}</p>
      </template>
    </UTabs>
  </Card>
</template>

<script lang="ts" setup>
import Card from '~/components/ui-kit/Card.vue';
import {
  useReadContract,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from '@wagmi/vue';
import {
  hodlerAbi,
  tokenAbi,
} from '../assets/contract-artifacts/wagmi-generated';
import { formatUnits, parseEther } from 'viem';

interface Operator {
  operator: `0x${string}`;
  amount: string;
}

const { address, isConnected } = useAccount();
const { data: hash, isPending, writeContractAsync } = useWriteContract();
const { isLoading: isConfirming, isSuccess: isConfirmed } =
  useWaitForTransactionReceipt({
    hash,
  });
const toast = useToast();

const CONTRACT_ADDRESS = '0x948B3c65b89DF0B4894ABE91E6D02FE579834F8F';
const OPERATOR_ADDRESS = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

const stakeDialogOpen = ref(false);
const unstakeDialogOpen = ref(false);
const stakeAmount = ref(0);
const unstakeAmount = ref(0);
const operatorAction = ref<'stake' | 'unstake' | null>(null);
const selectedOperator = ref<Operator | null>(null);
const hodlerAddress = computed(() => address.value);
const operators = computed(() => {
  if (!stakesData.value) return [];
  const stakes: Operator[] = stakesData.value.map((stake) => {
    const amount = formatUnits(stake.amount, 18);
    return {
      operator: stake.operator,
      amount,
    };
  });
  return stakes;
});
const isSubmitting = computed(() => isPending || isConfirming);

const {
  data: stakesData,
  isLoading,
  error,
} = useReadContract({
  address: CONTRACT_ADDRESS as `0x${string}`,
  abi: hodlerAbi,
  functionName: 'getStakes',
  args: [hodlerAddress.value as `0x${string}`],
  query: {
    enabled: !!hodlerAddress.value,
  },
});

watch(stakesData, (stakes) => {
  if (stakes) {
    console.log('stakes: ', toRaw(stakes));
  }
});

const { data: tokenAddress } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: hodlerAbi,
  functionName: 'tokenContract',
  query: { enabled: true },
});

const { data: allowance } = useReadContract({
  address: tokenAddress.value as `0x${string}`,
  abi: tokenAbi,
  functionName: 'allowance',
  args: [hodlerAddress.value as `0x${string}`, CONTRACT_ADDRESS],
  query: {
    enabled: !!hodlerAddress.value && !!tokenAddress.value,
  },
});

const items = [
  {
    slot: 'operators',
    label: 'Operators',
  },
  {
    slot: 'vault',
    label: 'Vault',
  },
];

const columns = [
  {
    key: 'operator',
    label: 'Address',
  },
  {
    key: 'amount',
    label: 'Amount staked',
  },
  {
    key: 'actions',
  },
];

const operatorActionItems = (row: Operator) => [
  [
    {
      label: 'Stake',
      icon: 'i-heroicons-chart-pie-20-solid',
      click: () => [(selectedOperator.value = row), handleStake()],
    },
    {
      label: 'Unstake',
      icon: 'i-heroicons-x-circle-20-solid',
      click: () => [(selectedOperator.value = row), handleUnstake()],
      disabled: !row.amount,
    },
  ],
];

const handleStake = () => {
  stakeDialogOpen.value = true;
  operatorAction.value = 'stake';
};

const handleUnstake = () => {
  unstakeDialogOpen.value = true;
  operatorAction.value = 'unstake';
};

const submitStakeForm = async () => {
  if (!isConnected) {
    toast.add({
      title: 'Please connect your wallet to stake',
      color: 'red',
    });
    return;
  }

  if (!stakeAmount.value || Number(stakeAmount.value) <= 0) {
    toast.add({
      title: 'Enter a valid stake amount',
      color: 'red',
    });
    return;
  }

  try {
    // console.log('parsing amount...');
    const amount = parseEther(stakeAmount.value.toString());

    if (allowance.value === undefined || allowance.value < amount) {
      // console.log('Approving tokens...');
      await writeContractAsync({
        address: tokenAddress.value,
        abi: tokenAbi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, amount],
      });

      console.log('Approved Hodler contract to spend tokens');
    } else {
      console.log('Sufficient allowance, skipping approval');
    }

    // console.log('writing to contract...');
    await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: hodlerAbi,
      functionName: 'stake',
      args: [OPERATOR_ADDRESS, amount],
    });
  } catch (error: any) {
    console.error('StakingError:', error);
    toast.add({
      title: 'Failed to stake tokens',
      color: 'red',
    });
  }
};

const submitUnstakeForm = async () => {
  if (!isConnected) {
    toast.add({
      title: 'Please connect your wallet to unstake',
      color: 'red',
    });
    return;
  }

  if (!unstakeAmount.value || Number(unstakeAmount.value) <= 0) {
    toast.add({
      title: 'Enter a valid amount to unstake',
      color: 'red',
    });
    return;
  }

  try {
    const amount = parseEther(unstakeAmount.value.toString());

    await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: hodlerAbi,
      functionName: 'unstake',
      args: [OPERATOR_ADDRESS, amount],
    });
  } catch (error) {
    console.error('UnstakingError:', error);
    toast.add({
      title: 'Failed to unstake tokens',
      color: 'red',
    });
  }
};

watch(isConfirmed, (confirmed) => {
  if (confirmed) {
    if (operatorAction.value === 'stake') {
      toast.add({
        title: `Staked ${stakeAmount.value} tokens with operator`,
        color: 'green',
      });
      stakeAmount.value = 0;
    } else if (operatorAction.value === 'unstake') {
      toast.add({
        title: `Unstaked ${unstakeAmount.value} tokens from operator`,
        color: 'green',
      });
      unstakeAmount.value = 0;
    }
  }
});
</script>
