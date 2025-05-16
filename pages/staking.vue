<template>
  <Card>
    <div class="flex items-center space-x-2 mb-6">
      <Icon name="i-heroicons-chart-pie-20-solid" class="text-3xl" />
      <h2 class="text-3xl">Staking</h2>
    </div>
    <UTabs
      :items="tabItems"
      @change="onTabChange"
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
          :columns="operatorColumns"
          :rows="operators"
        >
          <template #operator-data="{ row }: { row: Operator }">
            <span> {{ truncatedAddress(row.operator) }} </span>
          </template>
          <template #actions-data="{ row }">
            <UDropdown
              :items="operatorActionItems(row)"
              :popper="{ placement: 'right-start' }"
            >
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-ellipsis-horizontal-20-solid"
              />

              <template #item="{ item }">
                <UIcon
                  :name="
                    item.label === 'Copy Address' && copied
                      ? 'i-heroicons-check-20-solid'
                      : item.icon
                  "
                  class="w-[1rem] h-[1rem]"
                />
                <span>
                  {{
                    item.label === 'Copy Address' && copied
                      ? 'Copied!'
                      : item.label
                  }}
                </span>
              </template>
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
      <template #vaults="{ item }">
        <UTable
          :empty-state="{
            icon: 'i-heroicons-circle-stack-20-solid',
            label: 'No vaults.',
          }"
          :columns="vaultColumns"
          :rows="vaults"
        >
        </UTable>
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
import { useClipboard } from '@vueuse/core';

interface Vault {
  amount: bigint;
  availableAt: bigint;
  kind: bigint;
  data: string;
}

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
const { copy, copied } = useClipboard();

const CONTRACT_ADDRESS = '0x948B3c65b89DF0B4894ABE91E6D02FE579834F8F';
const OPERATOR_ADDRESS = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

const stakeDialogOpen = ref(false);
const unstakeDialogOpen = ref(false);
const stakeAmount = ref(0);
const unstakeAmount = ref(0);
const currentTab = ref<'operators' | 'vaults'>('operators');
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
const vaults = computed(() => {
  if (!vaultsData.value) return [];
  const data = vaultsData.value.map((vault) => {
    const amount = formatUnits(vault.amount, 18);
    const timeDiff = Number(vault.availableAt) * 1000 - Date.now();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const availableAt = `${days} Days ${hours} Hrs ${minutes} Min`;
    return {
      amount,
      data: truncatedAddress(vault.data),
      kind: vault.kind,
      availableAt,
    };
  });
  return data;
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
    enabled:
      !!hodlerAddress.value && computed(() => currentTab.value === 'operators'),
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
  query: { enabled: computed(() => currentTab.value === 'operators') },
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

const onTabChange = (index: number) => {
  const item = tabItems[index];

  currentTab.value = item.slot as 'operators' | 'vaults';
};

const tabItems = [
  {
    slot: 'operators',
    label: 'Operators',
  },
  {
    slot: 'vaults',
    label: 'Vaults',
  },
];

const operatorColumns = [
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
    {
      label: 'Copy Address',
      icon: 'i-heroicons-clipboard-20-solid',
      click: (e: any) => [e.preventDefault(), copy(row.operator)],
    },
  ],
];

const vaultColumns = [
  {
    key: 'data',
    label: 'From',
  },
  {
    key: 'amount',
    label: 'Amount in vault',
  },
  {
    key: 'availableAt',
    label: 'Available in',
  },
  {
    key: 'kind',
    label: 'Type',
  },
  {
    key: 'actions',
  },
];

// const vaultActionItems = (row: Vault) => [
//   [
//     {
//       label: 'Claim',
//       icon: '',
//       click:
//     },
//   ],
// ];

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

// vault stuff
const { data: vaultsData } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: hodlerAbi,
  functionName: 'getVaults',
  args: [hodlerAddress.value as `0x${string}`],
  query: { enabled: computed(() => currentTab.value === 'vaults') },
});
</script>
