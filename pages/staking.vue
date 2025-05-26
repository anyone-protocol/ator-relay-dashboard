<template>
  <div class="flex flex-col-reverse lg:flex-row gap-5">
    <Card class="min-w-max w-max h-max aspect-square">
      <div class="p-2">
        <div class="flex gap-1 items-center">
          <UIcon class="text-lg" name="i-heroicons-arrow-up-circle-solid" />
          <h3 class="font-medium">Staking Rewards</h3>
        </div>
        <div class="mt-6 mb-2 flex flex-col border-l-2 border-cyan-600 pl-3">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Unclaimed Rewards
          </p>
          <div class="inline-flex items-baseline gap-2">
            <template v-if="claimableRewardsPending">
              <USkeleton class="w-full h-10" />
            </template>
            <template v-else>
              <span class="text-3xl">
                <template v-if="isConnected">
                  {{ formatEtherNoRound(claimableRewards || '0') }}
                </template>
                <template v-else> -- </template>
              </span>
            </template>
          </div>
        </div>
        <UButton
          class="ring-1 ring-neutral-200 dark:ring-neutral-800"
          @click="claimStakingRewardsMutation()"
          :disabled="
            !isConnected ||
            claimableRewardsPending ||
            Number(claimableRewards) <= 0
          "
          :loading="claimStakingRewardsPending"
          color="gray"
          variant="soft"
        >
          Claim
        </UButton>
      </div>
    </Card>
    <Card>
      <div class="flex items-center justify-between mb-6 gap-3">
        <div class="flex items-center space-x-2">
          <Icon name="i-heroicons-chart-pie-20-solid" class="text-3xl" />
          <h2 class="text-3xl">Staking</h2>
        </div>
        <UInput
          v-if="currentTab === 'operators' || currentTab === 'stakedOperators'"
          v-model="searchQuery"
          color="gray"
          variant="outline"
          icon="i-heroicons-magnifying-glass"
          placeholder="Search by address"
        />
      </div>

      <UTabs
        :items="tabItems"
        @change="onTabChange"
        :ui="{
          list: {
            width: 'w-max max-w-full',
            background: '',
            marker: {
              background: '',
            },
            padding: 'p-0',
            height: 'h-max',
            tab: {
              base: 'pb-2 px-4 text-cyan-700 dark:text-cyan-300 font-medium w-max',
              rounded: 'rounded-none',
              background: '',
              active: 'border-b border-cyan-500 text-black dark:text-white',
              size: 'text-xs md:text-sm',
            },
          },
        }"
      >
        <template #default="{ item, index, selected }">
          <span class="truncate text-cyan-700 dark:text-cyan-200">{{
            item.label
          }}</span>
        </template>
        <template v-slot:[currentTab]="{ item }">
          <UTable
            :empty-state="{
              icon: 'i-heroicons-circle-stack-20-solid',
              label: 'No operators.',
            }"
            :loading="currentTab === 'operators' && operatorRegistryPending"
            :columns="operatorColumns"
            :rows="
              currentTab === 'operators'
                ? allOperators
                : filteredStakedOperators
            "
          >
            <template #operator-data="{ row }: { row: Operator }">
              <span> {{ truncatedAddress(row.operator) }} </span>
            </template>
            <template #total-data="{ row }: { row: Operator }">
              <span> N/A </span>
            </template>
            <template #actions-data="{ row }">
              <UDropdown
                :items="operatorActionItems(row)"
                :popper="{ placement: 'left-start' }"
              >
                <UButton
                  size="xs"
                  variant="ghost"
                  icon="i-heroicons-ellipsis-horizontal-20-solid"
                  class="hover:bg-neutral-200 hover:dark:bg-neutral-800"
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
                      @click="
                        [(unstakeAmount = 0), (unstakeDialogOpen = false)]
                      "
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
            <template #availableAt-data="{ row }: { row: Vault }">
              <span>{{
                formatAvailableAt(row.availableAt) === 'Expired'
                  ? '0D 0H 0S'
                  : formatAvailableAt(row.availableAt)
              }}</span>
            </template>

            <template #status-data="{ row }: { row: Vault }">
              <UBadge
                :color="
                  formatAvailableAt(row.availableAt) === 'Expired'
                    ? 'green'
                    : 'white'
                "
                variant="outline"
              >
                {{
                  formatAvailableAt(row.availableAt) === 'Expired'
                    ? 'Expired'
                    : 'Active'
                }}
              </UBadge>
            </template>
          </UTable>
        </template>
      </UTabs>

      <div class="mt-5 flex justify-between">
        <div>
          <div class="my-2 flex flex-col border-l-2 border-cyan-600 pl-3">
            <h3>Available tokens</h3>
            <div class="inline-flex items-baseline gap-2">
              <template v-if="hodlerInfoPending">
                <USkeleton class="w-[15rem] h-10" />
              </template>
              <template v-else>
                <span class="text-3xl">
                  <template v-if="isConnected">
                    {{ formatEtherNoRound(hodlerInfo?.[0] || '0') }}
                  </template>
                  <template v-else> -- </template>
                </span>
              </template>
            </div>
          </div>
          <UButton
            :disabled="!isConnected || Number(hodlerInfo?.[0]) <= 0"
            @click="withdrawDialogOpen = true"
            variant="outline"
            color="cyan"
          >
            Withdraw
          </UButton>
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
              <label for="withdrawAmount" class="text-sm"
                >Amount to withdraw:
              </label>
              <UInput
                name="withdrawAmount"
                class="mt-2 mb-6"
                v-model="withdrawAmount"
                color="neutral"
                placeholder="Withdraw amount"
                type="number"
                min="0"
              />
              <div class="flex justify-end gap-3">
                <UButton
                  variant="outline"
                  color="cyan"
                  @click="[(withdrawAmount = 0), (withdrawDialogOpen = false)]"
                >
                  Cancel
                </UButton>
                <UButton
                  :disabled="withdrawAmount <= 0"
                  variant="solid"
                  color="cyan"
                  type="submit"
                >
                  Withdraw
                </UButton>
              </div>
            </form>
          </UCard>
        </UModal>

        <div v-if="currentTab === 'vaults'">
          <div class="my-2 flex flex-col border-l-2 border-cyan-600 pl-3">
            <h3>Claimable Tokens</h3>
            <div class="inline-flex items-baseline gap-2">
              <template v-if="vaultsPending">
                <USkeleton class="w-[15rem] h-10" />
              </template>
              <template v-else>
                <span class="text-3xl">
                  <template v-if="isConnected">
                    {{ formatEtherNoRound(totalClaimableAmount || '0') }}
                  </template>
                  <template v-else>--</template>
                </span>
              </template>
            </div>
          </div>
          <UButton
            :disabled="!isConnected || totalClaimableAmount <= 0n"
            @click="claimTokens"
            variant="outline"
            color="cyan"
          >
            Claim All
          </UButton>
        </div>
      </div>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import Card from '~/components/ui-kit/Card.vue';
import {
  useReadContract,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from '@wagmi/vue';
import { hodlerAbi } from '../assets/abi/hodler';
import { tokenAbi } from '../assets/abi/token';
import { formatUnits, getAddress, parseEther } from 'viem';
import { useClipboard } from '@vueuse/core';
import { getBlock } from '@wagmi/core';
import { config } from '~/config/wagmi.config';
import { useMutation, useQuery } from '@tanstack/vue-query';

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
const runtimeConfig = useRuntimeConfig();

const hodlerContract = runtimeConfig.public.hodlerContract as `0x${string}`;
const tokenContract = runtimeConfig.public
  .sepoliaAtorTokenContract as `0x${string}`;

const stakeDialogOpen = ref(false);
const unstakeDialogOpen = ref(false);
const withdrawDialogOpen = ref(false);
const stakeAmount = ref(0);
const unstakeAmount = ref(0);
const withdrawAmount = ref(0);
const totalClaimableAmount = ref<bigint>(0n);
const searchQuery = ref('');
const operatorRegistry = useOperatorRegistry();
const operatorRegistryPending = ref(false);
const currentTab = ref<'operators' | 'stakedOperators' | 'vaults'>('operators');
const operatorAction = ref<'stake' | 'unstake' | null>(null);
const selectedOperator = ref<Operator | null>(null);
const hodlerAddress = computed(() => address.value);
const stakedOperators = computed(() => {
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
const allOperators = ref<Operator[]>([]);
const vaults = computed(() => {
  if (!vaultsData.value) return [];
  const data = vaultsData.value
    .filter((vault) => vault.kind === 2n)
    .map((vault) => {
      const amount = formatUnits(vault.amount, 18);
      return {
        amount,
        data: vault.data,
        kind: vault.kind,
        availableAt: vault.availableAt,
      };
    });
  return data;
});
const isSubmitting = computed(() => isPending || isConfirming);

const { getClaimableStakingRewards, claimStakingRewards } = useStakingRewards();

const { data: claimableRewards, isPending: claimableRewardsPending } = useQuery(
  {
    queryKey: ['claimableRewards', address],
    queryFn: async () => {
      if (!address.value) return '0';

      return getClaimableStakingRewards(address.value);
    },
    enabled: !!address.value,
  }
);

const {
  mutate: claimStakingRewardsMutation,
  data: claimStakingRewardsResult,
  isPending: claimStakingRewardsPending,
  isSuccess: claimStakingRewardsSuccess,
  isError: claimStakingRewardsError,
} = useMutation({
  mutationFn: async () => {
    if (!address.value) {
      toast.add({
        title: 'Please connect wallet to claim',
        color: 'red',
      });
      return;
    }

    return claimStakingRewards(address.value);
  },
});

watch([claimStakingRewardsSuccess, claimStakingRewardsError], () => {
  if (claimStakingRewardsError) {
    toast.add({
      title: 'Failed to claim staking rewards',
      color: 'red',
    });
  }

  // TODO - need to do more robust check here
  if (claimStakingRewardsSuccess) {
    toast.add({
      title: `Successfully claimed ${claimableRewards.value} tokens`,
      color: 'green',
    });
    claimableRewards.value = '0';
  }
});

const {
  data: stakesData,
  isLoading,
  error,
  refetch: refetchStakes,
} = useReadContract({
  address: hodlerContract,
  abi: hodlerAbi,
  functionName: 'getStakes',
  args: [hodlerAddress.value as `0x${string}`],
  query: {
    enabled:
      !!hodlerAddress.value && computed(() => currentTab.value === 'operators'),
  },
});

const { data: tokenAddress } = useReadContract({
  address: hodlerContract,
  abi: hodlerAbi,
  functionName: 'tokenContract',
  query: { enabled: computed(() => currentTab.value === 'operators') },
});

const { data: allowance } = useReadContract({
  address: tokenContract,
  abi: tokenAbi,
  functionName: 'allowance',
  args: [hodlerAddress.value as `0x${string}`, hodlerContract],
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
    slot: 'stakedOperators',
    label: 'Your Staked',
  },
  {
    slot: 'vaults',
    label: 'Unstaked Tokens',
  },
];

const operatorColumns = [
  {
    key: 'operator',
    label: 'Operator',
  },
  {
    key: 'amount',
    label: 'Your stake',
  },
  {
    key: 'total',
    label: 'Total Staked',
  },
  {
    key: 'actions',
    label: 'Actions',
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
    label: 'Expires in',
  },
  {
    key: 'status',
    label: 'Vault status',
  },
];

const block = await getBlock(config);

const formatAvailableAt = (availableAt: bigint) => {
  const timestamp = block.timestamp;
  const timeDiffSeconds = availableAt - timestamp - BigInt(15 * 60);
  if (timeDiffSeconds <= 0n) return 'Expired';

  const secondsPerDay = BigInt(24 * 60 * 60);
  const secondsPerHour = BigInt(60 * 60);
  const secondsPerMinute = BigInt(60);

  const days = timeDiffSeconds / secondsPerDay;
  const hours = (timeDiffSeconds % secondsPerDay) / secondsPerHour;
  const minutes = (timeDiffSeconds % secondsPerHour) / secondsPerMinute;

  return `${days}D ${hours}H ${minutes}M`;
};

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

  if (!selectedOperator.value?.operator) {
    toast.add({
      title: 'You must select an operator to stake',
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
        address: tokenContract,
        abi: tokenAbi,
        functionName: 'approve',
        args: [hodlerContract, amount],
      });
    }

    // console.log('writing to contract...');
    await writeContractAsync({
      address: hodlerContract,
      abi: hodlerAbi,
      functionName: 'stake',
      args: [getAddress(selectedOperator.value?.operator), amount],
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

  if (!selectedOperator.value?.operator) {
    toast.add({
      title: 'You must select an operator to unstake',
      color: 'red',
    });
    return;
  }

  try {
    const amount = parseEther(unstakeAmount.value.toString());

    await writeContractAsync({
      address: hodlerContract,
      abi: hodlerAbi,
      functionName: 'unstake',
      args: [getAddress(selectedOperator.value?.operator), amount],
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
      refetchStakes();
    } else if (operatorAction.value === 'unstake') {
      toast.add({
        title: `Unstaked ${unstakeAmount.value} tokens from operator`,
        color: 'green',
      });
      unstakeAmount.value = 0;
      refetchStakes();
      refetchVaults();
    }
  }
});

const {
  data: vaultsData,
  isPending: vaultsPending,
  refetch: refetchVaults,
} = useReadContract({
  address: hodlerContract,
  abi: hodlerAbi,
  functionName: 'getVaults',
  args: [hodlerAddress.value as `0x${string}`],
  query: {
    enabled: computed(() => isConnected.value && currentTab.value === 'vaults'),
  },
});

watch(vaultsData, async (vaults) => {
  if (vaults) {
    updateTotalClaimable();
  }
});

const updateTotalClaimable = async () => {
  if (!vaultsData.value?.length) {
    totalClaimableAmount.value = 0n;
    return;
  }

  let total = 0n;
  await Promise.all(
    vaultsData.value.map(async (vault) => {
      const isClaimable = await claimable(vault.availableAt);
      if (isClaimable) total += vault.amount;
    })
  );
  totalClaimableAmount.value = total;
};

const {
  data: hodlerInfo,
  isPending: hodlerInfoPending,
  refetch: refetchHolderInfo,
} = useReadContract({
  address: hodlerContract,
  abi: hodlerAbi,
  functionName: 'hodlers',
  args: [hodlerAddress.value as `0x${string}`],
  query: { enabled: true },
});

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
    // TODO - await receipt & show success toast
    toast.add({
      title: `Withdrew ${withdrawAmount.value} tokens`,
      color: 'green',
    });
  } catch (error) {
    console.error('WithdrawError: ', error);
    toast.add({
      title: 'Failed to withdraw tokens',
      color: 'red',
    });
  }
};

const claimable = async (available: bigint) => {
  const TIMESTAMP_BUFFER = 15 * 60;
  const block = await getBlock(config);
  const timestamp = block.timestamp;
  // console.log('block_timestamp: ', timestamp);
  // console.log('available_timestamp: ', available);
  return available < timestamp - BigInt(TIMESTAMP_BUFFER);
};

const claimTokens = async (available: bigint) => {
  if (!isConnected) {
    toast.add({
      title: 'Please connect your wallet to claim tokens',
      color: 'red',
    });
    return;
  }

  if (Number(available) < Math.round(Date.now() / 1000)) {
    toast.add({
      title: `You can't claim these tokens yet`,
      color: 'red',
    });
    return;
  }

  try {
    await writeContractAsync({
      address: hodlerContract,
      abi: hodlerAbi,
      functionName: 'openExpired',
    });
  } catch (error) {
    console.error('VaultClaimError: ', error);
    toast.add({
      title: 'Failed to claim tokens from vault',
      color: 'red',
    });
  }
};

const filteredStakedOperators = computed(() => {
  if (!isConnected.value) return [];
  return stakedOperators.value.filter((op) =>
    op.operator.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const updateOperators = async () => {
  if (!isConnected.value) {
    allOperators.value = [];
    return;
  }
  try {
    operatorRegistryPending.value = true;
    const state = await operatorRegistry.viewState();
    const verifiedFingerprints =
      state?.VerifiedFingerprintsToOperatorAddresses || {};
    const registryOperators = Array.from(
      new Set(Object.values(verifiedFingerprints))
    ).map((address) => ({ operator: address as `0x${string}`, amount: '0' }));

    const combinedOperators = [
      ...stakedOperators.value,
      ...registryOperators.filter(
        (regOp) =>
          !stakedOperators.value.some(
            (stakeOp) => stakeOp.operator === regOp.operator
          )
      ),
    ];

    allOperators.value = combinedOperators.filter((op) =>
      op.operator.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  } catch (error) {
    console.error('OperatorRegistryError:', error);
  } finally {
    operatorRegistryPending.value = false;
  }
};

watch([stakedOperators, searchQuery], updateOperators);
watch(currentTab, (newTab) => {
  if (newTab === 'operators') updateOperators();
  if (newTab === 'vaults') updateTotalClaimable();
});
onMounted(() => {
  if (currentTab.value === 'operators' && isConnected.value) updateOperators();
});
</script>
