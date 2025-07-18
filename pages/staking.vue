<template>
  <div class="flex flex-col-reverse lg:flex-row gap-5 mt-4">
    <Card>
      <div class="flex lg:items-center justify-between mb-6 gap-5">
        <div class="flex flex-col gap-5 md:flex-row md:items-center md:gap-10">
          <div class="flex items-center space-x-1 md:space-x-2 h-max">
            <Icon
              name="i-heroicons-chart-pie-20-solid"
              class="w-[1.6rem] md:w-[1.8rem] h-[1.6rem] md:h-[1.8rem]"
            />
            <h2 class="text-2xl md:text-[2rem]">Staking</h2>
          </div>
          <div class="flex flex-col items-center md:flex-row gap-2">
            <div class="flex flex-col">
              <div class="flex items-center gap-1">
                <h3 class="text-[10px] md:text-xs">Redeemable Tokens</h3>
                <Popover
                  placement="left"
                  :arrow="false"
                  class="h-max grid place-items-center"
                >
                  <template #content>
                    <span class="text-xs font-normal">
                      Tokens that were unstaked and are now available to
                      withdraw from their vault. Withdraw these from the
                      <RouterLink to="/"><strong>Home</strong> </RouterLink>
                      page.
                    </span>
                  </template>
                  <template #trigger>
                    <Icon name="heroicons:exclamation-circle" />
                  </template>
                </Popover>
              </div>
              <div class="inline-flex items-baseline justify-end gap-2">
                <template v-if="vaultsPending">
                  <USkeleton class="w-[8rem] h-6" />
                </template>
                <template v-else>
                  <div class="flex gap-2 items-end md:items-center md:gap-3">
                    <div class="flex gap-1 items-baseline">
                      <span class="text-base md:text-xl">
                        <template v-if="isConnected">
                          {{ formatEtherNoRound(totalClaimableAmount || '0') }}
                        </template>
                        <template v-else>--</template>
                      </span>
                      <Ticker class="text-[9px] leading-tight" />
                    </div>
                    <!-- <UButton
                      :disabled="!isConnected || totalClaimableAmount <= 0n"
                      @click="claimTokens"
                      variant="outline"
                      color="cyan"
                      size="2xs"
                      class="text-[9px] md:text-xs"
                    >
                      Redeem expired
                    </UButton> -->
                  </div>
                </template>
              </div>
            </div>
            <StakingRewards />
          </div>
        </div>
        <div class="relative">
          <UInput
            v-model="searchQuery"
            color="gray"
            variant="outline"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search by address"
          />
        </div>
      </div>

      <UTabs :items="tabItems" @change="onTabChange">
        <template #default="{ item, index, selected }">
          <span class="truncate">{{ item.label }}</span>
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
            <template #amount-data="{ row }: { row: Operator }">
              <span> {{ formatEtherNoRound(row.amount) }} </span>
            </template>
            <template #total-data="{ row }: { row: Operator }">
              <span> {{ formatEtherNoRound(row.total || '0') }} </span>
            </template>
            <template #running-data="{ row }: { row: Operator }">
              <span :class="row.running ? 'text-green-500' : 'text-red-500'"
                >●</span
              >
            </template>
            <template #actions-data="{ row }: { row: Operator }">
              <UDropdown
                :items="operatorActionItems(row)"
                :popper="{ placement: 'left-start' }"
              >
                <UButton
                  size="xs"
                  variant="ghost"
                  icon="i-heroicons-ellipsis-horizontal-20-solid"
                  class="bg-neutral-100 hover:bg-neutral-200/50 text-neutral-950 dark:bg-neutral-800 hover:dark:bg-neutral-700/50 dark:text-white"
                />

                <template #item="{ item }">
                  <UIcon
                    :name="
                      item.label === 'Copy Address' &&
                      copied &&
                      copiedText === getAddress(row.operator)
                        ? 'i-heroicons-check-20-solid'
                        : item.icon
                    "
                    class="w-[1rem] h-[1rem]"
                  />
                  <span>
                    {{
                      item.label === 'Copy Address' &&
                      copied &&
                      copiedText === getAddress(row.operator)
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
                  color="gray"
                  variant="outline"
                  class="mb-6"
                  :disabled="true"
                  :model-value="selectedOperator?.operator"
                />
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <div class="text-neutral-400 text-sm">Amount to stake:</div>
                    <div class="flex justify-end gap-1 items-center">
                      <div
                        class="flex items-center ring-1 ring-neutral-200 dark:ring-neutral-700 focus-within::ring-2 focus-within:ring-primary-500 dark:focus-within:ring-primary-400 rounded-sm overflow-hidden"
                      >
                        <div
                          class="text-xs font-normal p-1 text-neutral-400 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-800/60"
                        >
                          {{
                            stakedMaxSelected === 'wallet'
                              ? formatEtherNoRound(tokenBalance?.value || '0')
                              : formatEtherNoRound(hodlerInfo?.[0] || '0')
                          }}
                        </div>
                        <div
                          class="w-[1px] h-6 bg-neutral-300 dark:bg-neutral-700"
                        ></div>
                        <USelect
                          :options="stakedMaxOptions"
                          v-model="stakedMaxSelected"
                          size="2xs"
                          variant="none"
                        />
                      </div>
                      <Popover
                        placement="top"
                        :arrow="false"
                        class="h-max grid place-items-center"
                      >
                        <template #content>
                          <span class="text-xs font-normal">
                            Choose if you want to set the max amount from tokens
                            in your wallet or available balance.
                          </span>
                        </template>
                        <template #trigger>
                          <Icon name="heroicons:exclamation-circle" class="" />
                        </template>
                      </Popover>
                    </div>
                  </div>
                  <div class="relative">
                    <UInput
                      :disabled="isSubmitting"
                      v-model="stakeInput"
                      color="neutral"
                      placeholder="Amount to stake"
                      min="0"
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
                    v-if="amountExceedsAvailable"
                    class="text-xs text-amber-600 dark:text-amber-300"
                  >
                    Chosen amount exceeds available balance. Amount will be
                    taken from wallet.
                  </span>
                  <span
                    v-else-if="amountIsLessThanAvailable"
                    class="text-xs text-amber-600 dark:text-amber-300"
                  >
                    Enough available tokens. Amount will be taken from available
                    balance.
                  </span>
                  <div class="flex justify-end gap-3 mt-5">
                    <UButton
                      size="xs"
                      type="button"
                      variant="outline"
                      color="cyan"
                      class="justify-center text-md"
                      @click="stakeDialogOpen = false"
                    >
                      Cancel
                    </UButton>
                    <UButton
                      :loading="isStaking"
                      :disabled="!parseFloat(stakeAmount)"
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
                  color="gray"
                  variant="outline"
                  class="mb-6"
                  :disabled="true"
                  :model-value="selectedOperator?.operator"
                />
                <div class="flex flex-col gap-2">
                  <div class="text-neutral-400 text-sm">Amount to unstake:</div>
                  <div class="relative">
                    <UInput
                      v-model="unstakeInput"
                      color="neutral"
                      placeholder="Amount to unstake"
                      min="0"
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
                      @click="unstakeDialogOpen = false"
                    >
                      Cancel
                    </UButton>
                    <UButton
                      :disabled="!unstakeAmount"
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
        <template #vaults="{ item }">
          <UTable
            :empty-state="{
              icon: 'i-heroicons-circle-stack-20-solid',
              label: 'No vaults.',
            }"
            :columns="vaultColumns"
            :rows="vaults"
          >
            <template #data-data="{ row }: { row: Vault }">
              <div class="flex items-center">
                <span>{{ truncatedAddress(row.data) }}</span>
                <UButton
                  icon=""
                  size="sm"
                  variant="ghost"
                  @click="copy(getAddress(row.data))"
                >
                  <Icon
                    v-if="copied && copiedText === getAddress(row.data)"
                    name="ion:checkmark-sharp"
                    class="h-3 w-3 text-green-600 dark:text-green-400"
                  />
                  <Icon v-else name="ion:copy-outline" class="h-3 w-3" />
                </UButton>
              </div>
            </template>
            <template #amount-data="{ row }: { row: Vault }">
              {{ formatEtherNoRound(row.amount) }}
            </template>
            <template #availableAt-data="{ row }: { row: Vault }">
              <span>{{
                formatAvailableAt(row.availableAt, block) === 'Expired'
                  ? '0D 0H 0S'
                  : formatAvailableAt(row.availableAt, block)
              }}</span>
            </template>

            <template #status-data="{ row }: { row: Vault }">
              <UBadge
                :color="
                  formatAvailableAt(row.availableAt, block) === 'Expired'
                    ? 'green'
                    : 'white'
                "
                variant="outline"
              >
                {{
                  formatAvailableAt(row.availableAt, block) === 'Expired'
                    ? 'Redeemable'
                    : 'Vaulted'
                }}
              </UBadge>
            </template>
          </UTable>
        </template>
      </UTabs>

      <div class="mt-5 flex justify-between"></div>
    </Card>
  </div>
</template>

<style lang="scss">
div[role='tablist'] {
  display: grid;
  grid-template-columns: repeat(3, auto) !important;
  width: 100%;
  justify-content: start;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 1px;
  }
}

.tab {
  position: relative;
  cursor: pointer;
  // padding: 6px 20px;
  font-weight: 400;
  font-size: 16px;
}

.tab-active::after {
  position: absolute;
  z-index: 1;
  bottom: 0;
  left: 0;
  content: '';
  display: block;
  width: 100%;
  height: 3px;
}

.tab-active {
  color: transparent;
  font-weight: 500;
}
</style>

<script lang="ts" setup>
import Card from '~/components/ui-kit/Card.vue';
import {
  useReadContract,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
} from '@wagmi/vue';
import { hodlerAbi } from '../assets/abi/hodler';
import { tokenAbi } from '../assets/abi/token';
import { getAddress, parseEther } from 'viem';
import { useClipboard } from '@vueuse/core';
import { getBlock, getChainId } from '@wagmi/core';
import { config } from '~/config/wagmi.config';
import Popover from '~/components/ui-kit/Popover.vue';
import Ticker from '~/components/ui-kit/Ticker.vue';
import { useQuery } from '@tanstack/vue-query';
import BigNumber from 'bignumber.js';

interface Vault {
  amount: bigint;
  availableAt: bigint;
  kind: bigint;
  data: string;
}

interface Operator {
  operator: `0x${string}`;
  amount: bigint;
  redeemableRewards?: string;
  total?: bigint;
  running?: boolean;
}

interface OperatorRewards {
  operator: string;
  redeemable: string;
}

const { address, isConnected } = useAccount();
const currentWriteAction = ref<
  'stake' | 'unstake' | 'withdraw' | 'openExpired' | null
>(null);
const {
  data: hash,
  isPending: writePending,
  writeContractAsync,
} = useWriteContract();
const { isLoading: isConfirming, isSuccess: isConfirmed } =
  useWaitForTransactionReceipt({
    hash,
  });
const toast = useToast();
const { copy, copied, text: copiedText } = useClipboard();
const runtimeConfig = useRuntimeConfig();
const {
  getClaimableStakingRewards,
  getLastRoundMetadata,
  getLastSnapshot,
  getStakingRewardsState,
  getStakingSnapshot,
} = useStakingRewards();

const hodlerContract = runtimeConfig.public.hodlerContract as `0x${string}`;
const tokenContract = runtimeConfig.public
  .sepoliaAtorTokenContract as `0x${string}`;

const stakeDialogOpen = ref(false);
const unstakeDialogOpen = ref(false);
const stakeInput = ref('');
const maxStakeAmount = ref('');
const stakeAmount = computed(() => validateTokenInput(stakeInput.value) || '0');
const unstakeInput = ref('');
const unstakeAmount = computed(
  () => validateTokenInput(unstakeInput.value) || '0'
);
const totalClaimableAmount = ref<bigint>(0n);
const searchQuery = ref('');
const operatorRegistry = useOperatorRegistry();
const operatorRegistryPending = ref(false);
const currentTab = ref<'operators' | 'stakedOperators' | 'vaults'>('operators');
const selectedOperator = ref<Operator | null>(null);
const operatorRewards = ref<OperatorRewards[]>([]);
const hodlerAddress = computed(() => address.value);
// for testing purposes - should get running from LastRoundMetadata
const runningThreshold = computed(
  () => lastSnapshot.value?.Configuration.Requirements.Running
);
const stakedOperators = computed(() => {
  if (!stakesData.value) return [];
  const normalizeOp = (operator: `0x${string}`) =>
    `0x${operator.slice(2).toUpperCase()}` as `0x${string}`;

  const stakes: Operator[] = stakesData.value.map((stake) => {
    const reward = operatorRewards.value.find(
      (r) =>
        normalizeOp(r.operator as `0x${string}`) ===
          normalizeOp(stake.operator) && new BigNumber(r.redeemable).gt(0)
    );
    // console.log('reward: ', reward);
    return {
      operator: `0x${stake.operator.slice(2).toUpperCase()}`,
      amount: stake.amount,
      redeemableRewards: reward
        ? formatEtherNoRound(reward.redeemable)
        : '0.00',
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
      const data = `0x${vault.data.slice(2).toUpperCase()}`;
      return {
        amount: vault.amount,
        data,
        kind: vault.kind,
        availableAt: vault.availableAt,
      };
    });
  return data;
});
const isSubmitting = computed(() => writePending.value || isConfirming.value);
const isStaking = computed(
  () => isSubmitting.value && currentWriteAction.value === 'stake'
);
const isUnstaking = computed(
  () => isSubmitting.value && currentWriteAction.value === 'unstake'
);

const chainId = getChainId(config);

const { data: tokenBalance, isPending: tokenBalancePending } = useBalance({
  address: address.value,
  // need to confirm whether to set dynamically or use only mainnet
  chainId: chainId,
  token: tokenContract,
  query: {
    enabled: computed(() => !!address.value),
  },
});

const { data: lastSnapshot } = useQuery({
  queryKey: ['lastSnapshot'],
  queryFn: getLastSnapshot,
  enabled: computed(() => !!address.value),
});

const { data: stakingSnapshot } = useQuery({
  queryKey: ['stakingSnapshot'],
  queryFn: getStakingSnapshot,
  enabled: computed(() => !!address.value),
});

const { data: lastRoundMeta } = useQuery({
  queryKey: ['lastRoundMeta'],
  queryFn: getLastRoundMetadata,
  enabled: computed(() => !!address.value),
});

const { data: stakingRewardsState } = useQuery({
  queryKey: ['stakingRewardsState'],
  queryFn: getStakingRewardsState,
  enabled: computed(() => !!address.value),
});

const { data: operatorRewardsData } = useQuery({
  queryKey: ['operatorRewards', address],
  queryFn: async () => {
    if (!address.value) return [];
    return getClaimableStakingRewards(address.value);
  },
  enabled: computed(
    () => !!address.value && currentTab.value === 'stakedOperators'
  ),
});

watch(operatorRewardsData, (newData) => {
  if (newData) operatorRewards.value = newData;
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
    label: 'All Operators',
  },
  {
    slot: 'stakedOperators',
    label: 'Your Stakes',
  },
  {
    slot: 'vaults',
    label: 'Unstaked Tokens',
  },
];

const operatorColumns = computed(() => {
  if (currentTab.value === 'stakedOperators') {
    return [
      { key: 'operator', label: 'Operator', sortable: true },
      { key: 'amount', label: 'Your stake', sortable: true },
      { key: 'total', label: 'Total Stakes', sortable: true },
      { key: 'running', label: 'Running', sortable: true },
      { key: 'redeemableRewards', label: 'Rewards', sortable: true },
      { key: 'actions', label: 'Actions' },
    ];
  }
  return [
    { key: 'operator', label: 'Operator', sortable: true },
    { key: 'amount', label: 'Your stake', sortable: true },
    { key: 'total', label: 'Total Stakes', sortable: true },
    { key: 'running', label: 'Running', sortable: true },
    { key: 'actions', label: 'Actions' },
  ];
});

const operatorActionItems = (row: Operator) => [
  [
    {
      label: 'Stake',
      icon: 'i-heroicons-chart-pie-20-solid',
      click: () => [
        (selectedOperator.value = row),
        (stakeDialogOpen.value = true),
      ],
    },
    {
      label: 'Unstake',
      icon: 'i-heroicons-x-circle-20-solid',
      click: () => [
        (selectedOperator.value = row),
        (unstakeDialogOpen.value = true),
      ],
      disabled: !row.amount,
    },
    {
      label: 'Copy Address',
      icon: 'i-heroicons-clipboard-20-solid',
      click: (e: any) => [e.preventDefault(), copy(getAddress(row.operator))],
    },
  ],
];

const vaultColumns = [
  {
    key: 'data',
    label: 'From',
    sortable: true,
  },
  {
    key: 'amount',
    label: 'Amount in vault',
    sortable: true,
  },
  {
    key: 'availableAt',
    label: 'Expires in',
    sortable: true,
  },
  {
    key: 'status',
    label: 'Vault status',
    sortable: true,
  },
];

type MaxStakeOption = 'wallet' | 'available';

const stakedMaxOptions = ['wallet', 'available'];
const stakedMaxSelected = ref<MaxStakeOption>(
  stakedMaxOptions[0] as MaxStakeOption
);

const amountExceedsAvailable = computed(() => {
  if (stakeAmount.value === '0') return false;
  if (!hodlerInfo.value?.[0]) return false;

  const available = new BigNumber(
    parseEther(formatEtherNoRound(hodlerInfo.value[0])).toString()
  );
  const amount = new BigNumber(parseEther(stakeAmount.value).toString());

  if (stakedMaxSelected.value === 'available' && amount.gt(available)) {
    return true;
  }
  return false;
});

const amountIsLessThanAvailable = computed(() => {
  if (stakeAmount.value === '0') return false;
  if (!hodlerInfo.value?.[0]) return false;

  const available = new BigNumber(
    parseEther(formatEtherNoRound(hodlerInfo.value[0])).toString()
  );
  const amount = new BigNumber(parseEther(stakeAmount.value).toString());

  if (
    stakedMaxSelected.value === 'wallet' &&
    available.minus(amount).isGreaterThan(0)
  ) {
    return true;
  }
  return false;
});

const validateMaxStake = () => {
  if (stakedMaxSelected.value === 'wallet') {
    // console.log('token balance: ', tokenBalance.value?.value);
    return !!tokenBalance.value?.value;
  } else {
    return !!hodlerInfo.value?.[0];
  }
};

const block = await getBlock(config);

watch(stakeDialogOpen, (open) => {
  if (!open) {
    handleCloseStakeDialog();
  }
});

watch(stakeInput, (value) => {
  if (value) {
    maxStakeAmount.value = '';
  }
});

const handleCloseStakeDialog = () => {
  if (isStaking.value) {
    toast.add({
      id: 'staking',
      title: `Staking ${stakeAmount.value} tokens with operator...`,
      color: 'blue',
      timeout: 0,
    });
  } else {
    stakeInput.value = '';
  }
  stakeDialogOpen.value = false;
};

const setMaxStake = () => {
  if (stakedMaxSelected.value === 'wallet') {
    // console.log('token balance: ', tokenBalance.value?.value);

    stakeInput.value = tokenBalance.value?.value
      ? formatEtherNoRound(tokenBalance.value.value)
      : '0';
    setTimeout(() => {
      maxStakeAmount.value = tokenBalance.value?.value.toString() || '0';
    }, 50);
  } else {
    stakeInput.value = hodlerInfo.value?.[0]
      ? formatEtherNoRound(hodlerInfo.value?.[0])
      : '0';
    setTimeout(() => {
      maxStakeAmount.value = hodlerInfo.value?.[0]?.toString() || '0';
    }, 50);
  }
};

const setMaxUnstake = () => {
  // console.log('setting max unstake...');
  if (selectedOperator.value?.amount) {
    unstakeInput.value = formatEtherNoRound(
      selectedOperator.value.amount.toString()
    );
  }
};

watch(unstakeDialogOpen, (open) => {
  if (!open) {
    handleCloseUnstakeDialog();
  }
});

const handleCloseUnstakeDialog = () => {
  if (isUnstaking.value) {
    toast.add({
      id: 'unstaking',
      title: `Unstaking ${unstakeAmount.value} tokens from operator...`,
      color: 'blue',
      timeout: 0,
    });
  } else {
    unstakeInput.value = '';
  }
  unstakeDialogOpen.value = false;
};

const submitStakeForm = async () => {
  if (!isConnected) {
    toast.add({
      title: 'Please connect your wallet to stake',
      color: 'red',
    });
    return;
  }

  if (
    (!maxStakeAmount.value && !stakeAmount.value) ||
    Number(stakeAmount.value) <= 0
  ) {
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
    const amount = parseEther(stakeAmount.value).toString();
    const available = new BigNumber(
      hodlerInfo.value ? hodlerInfo.value[0].toString() : '0'
    );

    const amountToStake = maxStakeAmount.value || amount;

    // console.log('amount: ', amount);
    // console.log('max amount: ', maxStakeAmount.value);

    // console.log('amountToStake: ', amountToStake);

    // console.log('available: ', available);
    // console.log('amount: ', amount);

    currentWriteAction.value = 'stake';
    if (
      allowance.value === undefined ||
      (new BigNumber(allowance.value.toString()).lt(amount) &&
        new BigNumber(amount).gt(available))
    ) {
      // console.log('Approving tokens...');
      await writeContractAsync({
        address: tokenContract,
        abi: tokenAbi,
        functionName: 'approve',
        args: [hodlerContract, amountToStake],
      });
    }

    // console.log('writing to contract...');
    await writeContractAsync({
      address: hodlerContract,
      abi: hodlerAbi,
      functionName: 'stake',
      args: [getAddress(selectedOperator.value?.operator), amountToStake],
    });
  } catch (error: any) {
    console.error('StakingError:', error);
    toast.remove('staking');
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
    currentWriteAction.value = 'unstake';
    const amount = parseEther(unstakeAmount.value.toString());

    await writeContractAsync({
      address: hodlerContract,
      abi: hodlerAbi,
      functionName: 'unstake',
      args: [getAddress(selectedOperator.value?.operator), amount],
    });
  } catch (error) {
    console.error('UnstakingError:', error);
    toast.remove('unstaking');
    toast.add({
      title: 'Failed to unstake tokens',
      color: 'red',
    });
  }
};

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
    enabled: computed(() => isConnected.value),
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

  if (!claimable(available)) {
    toast.add({
      title: `You can't claim these tokens yet`,
      color: 'red',
    });
    return;
  }

  try {
    currentWriteAction.value = 'openExpired';
    toast.add({
      title: `Claiming ${totalClaimableAmount.value} tokens from expired vaults...`,
      color: 'blue',
      timeout: 0,
    });
    await writeContractAsync({
      address: hodlerContract,
      abi: hodlerAbi,
      functionName: 'openExpired',
    });
  } catch (error) {
    console.error('VaultClaimError: ', error);
    toast.remove('openExpired');
    toast.add({
      title: 'Failed to claim tokens from vault',
      color: 'red',
    });
  }
};

const filteredStakedOperators = computed(() => {
  if (!isConnected.value) return [];
  return stakedOperators.value
    .filter((op) =>
      op.operator.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
    .map((op) => {
      const operatorData = allOperators.value.find(
        (aOp) => aOp.operator === op.operator
      );
      return {
        ...op,
        total: operatorData?.total ?? 0n,
        running: operatorData?.running ?? false,
      };
    });
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
    ).map((address) => ({
      operator: address as `0x${string}`,
      amount: 0n,
    }));

    const normalizedStakedOperators = stakedOperators.value.map((op) => ({
      ...op,
      operator: `0x${op.operator.slice(2).toUpperCase()}` as `0x${string}`,
    }));

    const combinedOperators = [
      ...normalizedStakedOperators,
      ...registryOperators.filter(
        (regOp) =>
          !normalizedStakedOperators.some(
            (stakeOp) => stakeOp.operator === regOp.operator
          )
      ),
    ];

    // console.log('Staking snapshot data: ', toRaw(stakingSnapshot.value));

    const normalizedStakes = stakingSnapshot.value?.Stakes
      ? Object.fromEntries(
          Object.entries(stakingSnapshot.value.Stakes).map(([addr, amount]) => [
            `0x${addr.slice(2).toUpperCase()}` as `0x${string}`,
            amount,
          ])
        )
      : {};

    const normalizedNetwork = stakingSnapshot.value?.Network
      ? Object.fromEntries(
          Object.entries(stakingSnapshot.value.Network).map(([addr, data]) => [
            `0x${addr.slice(2).toUpperCase()}` as `0x${string}`,
            data,
          ])
        )
      : {};

    allOperators.value = combinedOperators
      .map((op) => {
        const networkData = normalizedNetwork[op.operator];
        const running = networkData?.running;
        const expected = networkData?.expected;
        const threshold = runningThreshold.value ?? 0.5;
        return {
          ...op,
          total: normalizedStakes[op.operator]
            ? BigInt(normalizedStakes[op.operator])
            : 0n,
          running: expected > 0 ? running / expected >= threshold : false,
        };
      })
      .filter((op) =>
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
  if (newTab === 'operators' || newTab === 'stakedOperators') updateOperators();
  if (newTab === 'vaults') updateTotalClaimable();
});
watch([stakingSnapshot, runningThreshold], () => {
  if (
    currentTab.value === 'operators' ||
    currentTab.value === 'stakedOperators'
  ) {
    updateOperators();
  }
});
onMounted(() => {
  if (currentTab.value === 'operators' && isConnected.value) updateOperators();
});

watch(isConfirmed, (confirmed) => {
  if (confirmed) {
    if (currentWriteAction.value === 'stake') {
      toast.remove('staking');
      toast.add({
        title: `Staked ${stakeAmount.value} tokens with operator`,
        color: 'green',
      });
      stakeInput.value = '';
      currentWriteAction.value = null;
      stakeDialogOpen.value = false;
      refetchStakes();
    } else if (currentWriteAction.value === 'unstake') {
      toast.remove('unstaking');
      toast.add({
        title: `Unstaked ${unstakeAmount.value} tokens from operator`,
        color: 'green',
      });
      unstakeInput.value = '';
      currentWriteAction.value = null;
      unstakeDialogOpen.value = false;
      refetchStakes();
      refetchVaults();
    } else if (currentWriteAction.value === 'openExpired') {
      toast.remove('openExpired');
      toast.add({
        title: `Claimed ${totalClaimableAmount.value} tokens across expired vaults`,
        color: 'green',
      });
      currentWriteAction.value = null;
      refetchVaults();
      refetchHolderInfo();
    }
  }
});
</script>
