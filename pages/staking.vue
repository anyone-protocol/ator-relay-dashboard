<template>
  <div class="flex flex-col-reverse lg:flex-row gap-5 mt-4 overflow-hidden">
    <Card class="overflow-auto">
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
              <div class="inline-flex items-baseline gap-2">
                <template v-if="vaultsPending && isConnected">
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
            placeholder="Search by address or domain"
            class="md:w-[15rem]"
          />
        </div>
      </div>

      <UTabs :items="tabItems" @change="onTabChange">
        <template #default="{ item, index, selected }">
          <span class="truncate">{{ item.label }}</span>
        </template>
        <template v-slot:[currentTab]="{ item }">
          <UTable
            class="max-h-[100vh] overflow-y-auto"
            id="operators-table"
            ref="operatorTableRef"
            :empty-state="{
              icon: 'i-heroicons-circle-stack-20-solid',
              label: 'No operators.',
            }"
            :loading="currentTab === 'operators' && operatorsWithDomainsPending"
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
            <template #domains-data="{ row }: { row: Operator }">
              <div class="flex items-center gap-1">
                <span>
                  {{
                    row.domains?.length ? `${row.domains[0].name}` : '-'
                  }}</span
                >
                <Popover
                  placement="left"
                  :arrow="false"
                  class="h-max grid place-items-center"
                  v-if="row.domains?.length"
                >
                  <template #content>
                    <ul class="flex flex-col gap-2">
                      <li v-for="domain in row.domains" :key="domain.tokenId">
                        {{ domain.name }}
                      </li>
                    </ul>
                  </template>
                  <template #trigger>
                    <UButton
                      v-if="row.domains?.length"
                      class="w-4 h-4 p-2 text-[12px]"
                      variant="soft"
                    >
                      {{ row.domains.length }}
                    </UButton>
                  </template>
                </Popover>
              </div>
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

          <!-- Dialogs -->
          <StakeDialog
            v-model:open="stakeDialogOpen"
            :operator="selectedOperator"
            :token-balance="tokenBalance"
            :hodler-info="hodlerInfo"
            :is-staking="isStaking"
            :is-submitting="isSubmitting"
            @stake="handleStake"
          />

          <UnstakeDialog
            v-model:open="unstakeDialogOpen"
            :operator="selectedOperator"
            :is-unstaking="isUnstaking"
            @unstake="handleUnstake"
          />
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
import StakeDialog from '~/components/staking/StakeDialog.vue';
import UnstakeDialog from '~/components/staking/UnstakeDialog.vue';
import {
  useReadContract,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
  useConfig,
} from '@wagmi/vue';
import { hodlerAbi } from '../assets/abi/hodler';
import { tokenAbi } from '../assets/abi/token';
import { getAddress, parseEther } from 'viem';
import { useClipboard, useVirtualList } from '@vueuse/core';
import { getBlock, getChainId } from '@wagmi/core';
import Popover from '~/components/ui-kit/Popover.vue';
import Ticker from '~/components/ui-kit/Ticker.vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import BigNumber from 'bignumber.js';
import { useDebounceFn } from '@vueuse/core';
import { filterOperatorsByQuery } from '~/utils/filterOperators';
import { useHyperbeamFlag } from '~/composables/useHyperbeamFlag';

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
  domains?: {
    tokenId: string;
    name: string;
    owner: string | undefined;
    tld: string;
  }[];
}

interface OperatorRewards {
  operator: string;
  redeemable: string;
}

const config = useConfig();
const queryClient = useQueryClient();

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
const { getClaimableStakingRewards, getLastSnapshot, getStakingSnapshot } =
  useStakingRewards();

const hodlerContract = runtimeConfig.public.hodlerContract as `0x${string}`;
const tokenContract =
  runtimeConfig.public.phase === 'live'
    ? (runtimeConfig.public.atorTokenContract as `0x${string}`)
    : (runtimeConfig.public.sepoliaAtorTokenContract as `0x${string}`);

const stakeDialogOpen = ref(false);
const unstakeDialogOpen = ref(false);
const totalClaimableAmount = ref<bigint>(0n);
const searchQuery = ref('');
const currentTab = ref<'operators' | 'stakedOperators' | 'vaults'>('operators');
const selectedOperator = ref<Operator | null>(null);
const lastStakeAmount = ref<string>('');
const lastUnstakeAmount = ref<string>('');
const hodlerAddress = computed(() => address.value);
const runningThreshold = computed(
  () => lastSnapshot.value?.Configuration?.Requirements?.Running
);
const stakedOperators = computed(() => {
  if (!stakesData.value) return [];
  const normalizeOp = (operator: `0x${string}`) =>
    `0x${operator.slice(2).toUpperCase()}` as `0x${string}`;

  const stakes: Operator[] = stakesData.value.map((stake) => {
    const reward = operatorRewardsData.value?.find(
      (r) =>
        normalizeOp(r.operator as `0x${string}`) ===
          normalizeOp(stake.operator) && new BigNumber(r.redeemable).gt(0)
    );
    return {
      operator: `0x${stake.operator.slice(2).toUpperCase()}`,
      amount: stake.amount,
      redeemableRewards: reward
        ? formatEtherNoRound(reward.redeemable, 3)
        : '0.000',
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
  queryKey: computed(() => ['lastSnapshot', address.value]),
  queryFn: getLastSnapshot,
  enabled: computed(() => !!address.value),
});

const { data: stakingSnapshot } = useQuery({
  queryKey: computed(() => ['stakingSnapshot', address.value]),
  queryFn: getStakingSnapshot,
  enabled: computed(() => !!address.value),
});

const { hyperbeamEnabled } = useHyperbeamFlag();
const isHyperbeamEnabled = computed(() => hyperbeamEnabled.value);

const { data: operatorRewardsData } = useQuery({
  queryKey: computed(() => [
    'operatorRewards',
    address.value,
    isHyperbeamEnabled.value,
  ]),
  queryFn: async () => {
    if (!address.value) return [];
    return getClaimableStakingRewards(address.value);
  },
  enabled: computed(() => !!address.value && isConnected.value),
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
  args: computed(() => [hodlerAddress.value as `0x${string}`] as const),
  query: {
    enabled: computed(() =>
      !!hodlerAddress.value &&
      (currentTab.value === 'operators' || currentTab.value === 'stakedOperators')
    ),
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
  args: computed(
    () => [hodlerAddress.value as `0x${string}`, hodlerContract] as const
  ),
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
      { key: 'domains', label: 'Domains', sortable: true },
      {
        key: 'redeemableRewards',
        label: 'Rewards',
        sortable: true,
        sort: (a: string, b: string, direction: 'asc' | 'desc') => {
          const aNum = parseFloat(a || '0');
          const bNum = parseFloat(b || '0');
          return direction === 'asc' ? aNum - bNum : bNum - aNum;
        },
      },
      { key: 'actions', label: 'Actions' },
    ];
  }
  return [
    { key: 'operator', label: 'Operator', sortable: true },
    { key: 'amount', label: 'Your stake', sortable: true },
    { key: 'total', label: 'Total Stakes', sortable: true },
    { key: 'running', label: 'Running', sortable: true },
    { key: 'domains', label: 'Domains', sortable: true },
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

const block = await getBlock(config);

const handleStake = async (data: { amount: string; maxAmount: string }) => {
  if (!isConnected.value) {
    toast.add({
      title: 'Please connect your wallet to stake',
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
    const available = new BigNumber(
      hodlerInfo.value ? hodlerInfo.value[0].toString() : '0'
    );

    const amountToStake = parseEther(
      data.maxAmount ? formatEtherNoRound(data.maxAmount) : data.amount
    ).toString();

    // store amount for success toast
    lastStakeAmount.value = data.amount;
    currentWriteAction.value = 'stake';

    toast.add({
      id: 'staking',
      title: `Staking ${data.amount} tokens with operator...`,
      color: 'blue',
      timeout: 0,
    });

    // Only approve if staking amount exceeds available balance in contract
    if (new BigNumber(amountToStake).gt(available)) {
      if (
        allowance.value === undefined ||
        new BigNumber(allowance.value.toString()).lt(amountToStake)
      ) {
        await writeContractAsync({
          address: tokenContract,
          abi: tokenAbi,
          functionName: 'approve',
          args: [hodlerContract, amountToStake],
        });
      }
    }

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

const handleUnstake = async (data: { amount: string; maxAmount: bigint }) => {
  if (!isConnected.value) {
    toast.add({
      title: 'Please connect your wallet to unstake',
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
    // Store amount for success toast
    lastUnstakeAmount.value = data.amount;
    currentWriteAction.value = 'unstake';

    toast.add({
      id: 'unstaking',
      title: `Unstaking ${data.amount} tokens from operator...`,
      color: 'blue',
      timeout: 0,
    });

    const amount = data.maxAmount || parseEther(data.amount.toString());

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
    throw error;
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
  args: computed(() => [hodlerAddress.value as `0x${string}`] as const),
  query: {
    enabled: computed(() => !!hodlerAddress.value && isConnected.value),
  },
});

watch(vaultsData, async (vaults) => {
  if (vaults) {
    updateTotalClaimable();
  }
});

watch(address, () => {
  if (isConnected.value) {
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
  args: computed(() => [hodlerAddress.value as `0x${string}`] as const),
  query: { enabled: true },
});

const claimable = async (available: bigint) => {
  const TIMESTAMP_BUFFER = 15 * 60;
  const block = await getBlock(config);
  const timestamp = block.timestamp;
  return available < timestamp - BigInt(TIMESTAMP_BUFFER);
};

const filteredStakedOperators = computed(() => {
  if (!isConnected.value) return [];

  const stakedWithPositiveAmount = stakedOperators.value.filter(
    (op) => op.amount > 0n
  );
  const filtered = filterOperatorsByQuery(
    stakedWithPositiveAmount,
    debouncedSearchQuery.value
  );

  const withData = filtered.map((op) => {
    const operatorData = allOperators.value.find(
      (aOp) => aOp.operator === op.operator
    );
    return {
      ...op,
      total: operatorData?.total ?? 0n,
      running: operatorData?.running ?? false,
      domains: operatorData?.domains ?? [],
    };
  });

  return withData.sort((a, b) => {
    // Primary sort: by amount (Your stake) descending
    if (a.amount > b.amount) return -1;
    if (a.amount < b.amount) return 1;
    // Secondary sort: by total (Total Stakes) descending
    const aTotal = a.total ?? 0n;
    const bTotal = b.total ?? 0n;
    if (aTotal > bTotal) return -1;
    if (aTotal < bTotal) return 1;
    return 0;
  });
});

const debouncedSearchQuery = ref('');

const debouncedSearch = useDebounceFn((value: string) => {
  debouncedSearchQuery.value = value;
}, 100);

watch(searchQuery, (newValue) => {
  debouncedSearch(newValue);
});

const updateOperators = async () => {
  if (!isConnected.value) {
    allOperators.value = [];
    return;
  }
  try {
    const operatorsMap = new Map(
      operatorsWithDomains.value?.map((op) => [op.address.toUpperCase(), op]) ||
        []
    );

    const operators =
      operatorsWithDomains.value?.map((op) => ({
        ...op,
        operator: op.address as `0x${string}`,
        amount: 0n,
      })) || [];

    const normalizedStakedOperators = stakedOperators.value.map((op) => {
      const upperOp = op.operator.toUpperCase();
      const mappedOp = operatorsMap.get(upperOp);
      return {
        ...op,
        operator: `0x${upperOp.slice(2)}` as `0x${string}`,
        domains: mappedOp?.domains ?? [],
      };
    });

    const combinedOperators = [
      ...normalizedStakedOperators,
      ...operators.filter(
        (op) =>
          !normalizedStakedOperators.some(
            (stakeOp) => stakeOp.operator === op.operator
          )
      ),
    ];

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

    const threshold = runningThreshold.value ?? 0.5;

    const operatorsWithData = combinedOperators.map((op) => {
      const networkData = normalizedNetwork[op.operator];
      const running = networkData?.running || 0;
      const expected = networkData?.expected || 0;
      return {
        ...op,
        total: normalizedStakes[op.operator]
          ? BigInt(normalizedStakes[op.operator])
          : 0n,
        running: expected > 0 ? running / expected >= threshold : false,
      };
    });

    const filtered = filterOperatorsByQuery(
      operatorsWithData,
      debouncedSearchQuery.value
    );

    allOperators.value = filtered.sort((a, b) => {
      // Primary sort: by amount (Your stake) descending
      if (a.amount > b.amount) return -1;
      if (a.amount < b.amount) return 1;
      // Secondary sort: by total (Total Stakes) descending
      const aTotal = a.total ?? 0n;
      const bTotal = b.total ?? 0n;
      if (aTotal > bTotal) return -1;
      if (aTotal < bTotal) return 1;
      return 0;
    });
  } catch (error) {
    console.error('OperatorRegistryError:', error);
  }
};

watch([stakedOperators, debouncedSearchQuery], updateOperators);
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
watch(address, () => {
  if (
    isConnected.value &&
    (currentTab.value === 'operators' || currentTab.value === 'stakedOperators')
  ) {
    updateOperators();
  }
});
onMounted(() => {
  if (currentTab.value === 'operators' && isConnected.value) updateOperators();
  if (isConnected.value) updateTotalClaimable();
});

watch(isConfirmed, (confirmed) => {
  if (confirmed) {
    if (currentWriteAction.value === 'stake') {
      stakeDialogOpen.value = false;
      toast.remove('staking');
      toast.add({
        title: `Staked ${lastStakeAmount.value} tokens with operator`,
        color: 'green',
      });
      currentWriteAction.value = null;
      refetchStakes();
    } else if (currentWriteAction.value === 'unstake') {
      unstakeDialogOpen.value = false;
      toast.remove('unstaking');
      toast.add({
        title: `Unstaked ${lastUnstakeAmount.value} tokens from operator`,
        color: 'green',
      });
      currentWriteAction.value = null;
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

const metricsAPI = runtimeConfig.public.centralizedMetricsAPI;

interface OperatorWithDomain {
  address: string;
  domains?: {
    tokenId: string;
    name: string;
    owner: string | undefined;
    tld: string;
  }[];
}

const getAllOperators = async () => {
  try {
    const response = await fetch(`${metricsAPI}/operators?withDomains=true`);

    const data: OperatorWithDomain[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching operators:', error);
  }
};

const { cacheOperators, getCachedOperators } = useOperatorCache();

const {
  data: operatorsWithDomains,
  isPending: operatorsWithDomainsPending,
  isSuccess: operatorsWithDomainsSuccess,
} = useQuery({
  queryKey: ['operatorsWithDomains'],
  queryFn: getAllOperators,
  enabled: computed(() => currentTab.value === 'operators'),
  initialData: () => {
    if (process.client) {
      const cached = getCachedOperators();
      return cached instanceof Promise ? undefined : cached;
    }
    return undefined;
  },
  staleTime: 1000 * 60 * 5,
  gcTime: Infinity,
});

watch(operatorsWithDomainsSuccess, (newData) => {
  if (newData && operatorsWithDomains.value?.length) {
    cacheOperators(operatorsWithDomains.value);
  }
});

onMounted(async () => {
  if (process.client && currentTab.value === 'operators') {
    const cached = await getCachedOperators();
    if (cached) {
      queryClient.setQueryData(['operatorsWithDomains'], cached);
    }
  }
});
</script>
