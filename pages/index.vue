<template>
  <div
    class="relative grid grid-flow-row grid-cols-1 pt-4 lg:pt-0 gap-6 lg:grid-cols-6 mt-4"
  >
    <div class="flex w-full flex-col gap-4 lg:col-span-6">
      <DashboardMobileSection title="account-balance">
        <Card title="Contract Balance" :icon="'eos-icons:master-outlined'">
          <div
            class="flex justify-between items-start lg:items-start flex-col lg:flex-row mb-2 lg:mb-0 lg:justify-between"
          >
            <div class="mb-4 flex flex-col border-l-4 border-cyan-600 pl-3">
              <span class="flex gap-1 items-center">
                <h3>Total Contract Balance</h3>
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
              <div class="inline-flex flex-col items-baseline">
                <template v-if="isPending">
                  <USkeleton class="w-[15rem] h-10" />
                </template>
                <template v-else>
                  <span v-if="isConnected" class="text-4xl font-medium">
                    {{ formatEtherNoRound(totalContract.toString()) }}
                  </span>
                  <span v-if="!isConnected" class="text-4xl font-medium">
                    --
                  </span>
                  <Ticker />
                </template>
              </div>
            </div>
            <UButton
              :disabled="availableTokens.isZero()"
              @click="withdrawDialogOpen = true"
              variant="outline"
              color="cyan"
              size="xl"
            >
              {{
                isWithdrawing
                  ? 'Withdrawing...'
                  : availableTokens.isZero()
                    ? 'Nothing to withdraw'
                    : 'Withdraw available'
              }}
            </UButton>

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
                  <div class="relative">
                    <UInput
                      :disabled="isWithdrawing"
                      v-model="withdrawInput"
                      name="withdrawAmount"
                      class="mt-2 mb-6"
                      color="neutral"
                      placeholder="Withdraw amount"
                      type="text"
                    />
                    <UButton
                      :disabled="availableTokens.isZero() || isWithdrawing"
                      @click="setMaxWithdraw"
                      size="2xs"
                      variant="ghost"
                      color="neutral"
                      class="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      Max
                    </UButton>
                  </div>
                  <div class="flex justify-end gap-3">
                    <UButton
                      variant="outline"
                      color="cyan"
                      @click="withdrawDialogOpen = false"
                    >
                      Cancel
                    </UButton>
                    <UButton
                      :disabled="!parseFloat(withdrawAmount)"
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
          </div>

          <div
            class="flex gap-5 lg:gap-16 xl:gap-24 2xl:gap-32 flex-col lg:flex-row my-4 lg:my-0 lg:mt-2"
          >
            <div class="flex gap-0 lg:gap-32 flex-col lg:flex-row">
              <div
                class="mb-4 flex flex-col border-l-4 border-cyan-600 lg:my-0 pl-3"
              >
                <div class="flex items-center gap-1">
                  <Icon name="material-symbols:check-box-rounded" />
                  <h3 class="text-sm">Available</h3>
                  <Popover
                    placement="top"
                    :arrow="false"
                    class="h-max grid place-items-center"
                  >
                    <template #content>
                      <span class="text-xs font-normal">
                        Available tokens in the smart contract. These tokens are
                        separate to your wallet balance and can be locked,
                        staked or withdrawn back to your wallet.
                      </span>
                    </template>
                    <template #trigger>
                      <Icon name="heroicons:exclamation-circle" />
                    </template>
                  </Popover>
                </div>
                <div class="inline-flex flex-col items-baseline">
                  <template v-if="hodlerInfoPending">
                    <USkeleton class="w-[10rem] h-10" />
                  </template>
                  <template v-else>
                    <span v-if="isConnected" class="text-3xl font-medium">
                      {{ formatEtherNoRound(hodlerInfo?.[0] || '0') }}
                    </span>
                    <span v-if="!isConnected" class="text-3xl font-medium">
                      --
                    </span>
                    <Ticker class="text-sm" />
                  </template>
                </div>
              </div>
            </div>
            <div class="flex gap-0 lg:gap-32 flex-col lg:flex-row">
              <div
                class="mb-4 flex flex-col border-l-4 border-cyan-600 lg:my-0 pl-3"
              >
                <div class="flex items-center gap-1">
                  <Icon name="material-symbols:lock" />
                  <h3 class="text-sm">Locked</h3>
                  <Popover
                    placement="top"
                    :arrow="false"
                    class="h-max grid place-items-center"
                  >
                    <template #content>
                      <span class="text-xs font-normal">
                        Tokens locked for your own relays, or delegated to other
                        relays. Manage them from the
                        <RouterLink
                          to="/relays"
                          style="text-decoration: underline"
                          ><strong>Relays</strong>
                        </RouterLink>
                        tab.
                      </span>
                    </template>
                    <template #trigger>
                      <Icon name="heroicons:exclamation-circle" />
                    </template>
                  </Popover>
                </div>
                <div class="inline-flex flex-col items-baseline">
                  <template v-if="locksPending">
                    <USkeleton class="w-[10rem] h-10" />
                  </template>
                  <template v-else>
                    <span v-if="isConnected" class="text-3xl font-medium">
                      {{ totalLockedTokens.toFixed(2) }}
                    </span>
                    <span v-if="!isConnected" class="text-3xl font-medium">
                      --
                    </span>
                    <Ticker class="text-sm" />
                  </template>
                </div>
              </div>
            </div>
            <div class="flex gap-0 lg:gap-32 flex-col lg:flex-row">
              <div
                class="mb-4 flex flex-col border-l-4 border-cyan-600 lg:my-0 pl-3"
              >
                <div class="flex items-center gap-1">
                  <Icon name="i-heroicons-chart-pie-20-solid" />
                  <h3 class="text-sm">Staked</h3>
                  <Popover
                    placement="top"
                    :arrow="false"
                    class="h-max grid place-items-center"
                  >
                    <template #content>
                      <span class="text-xs font-normal">
                        Your total staked tokens, including relay rewards which
                        are auto-compounded. Manage them from the
                        <RouterLink
                          to="/staking"
                          style="text-decoration: underline"
                          ><strong>Staking</strong>
                        </RouterLink>
                        tab.
                      </span>
                    </template>
                    <template #trigger>
                      <Icon name="heroicons:exclamation-circle" />
                    </template>
                  </Popover>
                </div>
                <div class="inline-flex flex-col items-baseline">
                  <template v-if="stakesPending">
                    <USkeleton class="w-[10rem] h-10" />
                  </template>
                  <template v-else>
                    <span v-if="isConnected" class="text-3xl font-medium">
                      {{ formatEtherNoRound(totalStaked.toString()) }}
                    </span>
                    <span v-if="!isConnected" class="text-3xl font-medium">
                      --
                    </span>
                    <Ticker class="text-sm" />
                  </template>
                </div>
              </div>
            </div>
            <div class="flex gap-0 lg:gap-3 flex-col lg:flex-row lg:items-end">
              <div
                class="mb-4 flex flex-col border-l-4 border-cyan-600 lg:my-0 pl-3"
              >
                <div class="flex items-center gap-1">
                  <Icon name="material-symbols:lock" />
                  <h3 class="text-sm">Vaulted</h3>
                  <Popover
                    placement="top"
                    :arrow="false"
                    class="h-max grid place-items-center"
                  >
                    <template #content>
                      <span class="text-xs font-normal">
                        Tokens are <strong>Vaulted</strong> for a fixed time
                        period when you unlock a relay or unstake tokens.
                        <strong>Redeem Expired</strong> redeems all tokens from
                        expired vaults.
                      </span>
                    </template>
                    <template #trigger>
                      <Icon name="heroicons:exclamation-circle" />
                    </template>
                  </Popover>
                </div>
                <div class="inline-flex flex-col items-baseline">
                  <template v-if="vaultsPending">
                    <USkeleton class="w-[10rem] h-10" />
                  </template>
                  <template v-else>
                    <span v-if="isConnected" class="text-3xl font-medium">
                      {{ formatEtherNoRound(totalVaulted.toString()) }}
                    </span>
                    <span v-if="!isConnected" class="text-3xl font-medium">
                      --
                    </span>
                    <Ticker class="text-sm" />
                  </template>
                </div>
              </div>
              <UButton
                :disabled="!isConnected || totalVaultClaimable.isZero()"
                :loading="isRedeemingTokens"
                @click="redeemTokens"
                variant="outline"
                color="cyan"
                size="md"
                class="self-end"
              >
                {{ isRedeemingTokens ? 'Redeeming...' : redeemLabel }}
              </UButton>
            </div>
          </div>
        </Card>
      </DashboardMobileSection>

      <DashboardMobileSection title="my-rewards">
        <div
          class="flex w-full flex-col gap-4 lg:flex-row-reverse lg:justify-between"
        >
          <Card title="Rewards History" icon="eos-icons:trusted-organization">
            <div
              class="flex justify-between items-start lg:items-center flex-col lg:grid lg:grid-cols-3 lg:gap-2 mb-2 lg:mb-0"
            >
              <div
                class="mb-4 flex flex-col justify-start border-l-4 border-cyan-600 pl-3"
              >
                <h3 class="text-sm">Relay rewards</h3>
                <template v-if="relayRewardsPending">
                  <USkeleton class="w-[10rem] h-10 mt-2" />
                </template>
                <template v-else>
                  <span v-if="isConnected" class="text-3xl font-medium">
                    {{ formatEtherNoRound(relayRewards?.toString() || '0') }}
                  </span>
                  <span v-if="!isConnected" class="text-3xl font-medium">
                    --
                  </span>
                  <Ticker class="text-sm" />
                </template>
              </div>

              <div
                class="mb-4 flex flex-col justify-start border-l-4 border-cyan-600 pl-3"
              >
                <h3 class="text-sm">Staking rewards</h3>
                <template v-if="stakingRewardsPending">
                  <USkeleton class="w-[10rem] h-10 mt-2" />
                </template>
                <template v-else>
                  <span v-if="isConnected" class="text-3xl font-medium">
                    {{ formatEtherNoRound(stakingRewards || '0') }}
                  </span>
                  <span v-if="!isConnected" class="text-3xl font-medium">
                    --
                  </span>
                  <Ticker class="text-sm" />
                </template>
              </div>

              <div class="mb-4 flex flex-col border-l-4 border-cyan-600 pl-3">
                <div class="flex flex-col items-start gap-2">
                  <h3 class="text-sm">Total claimed rewards</h3>
                </div>
                <template v-if="hodlerInfoPending">
                  <USkeleton class="w-[10rem] h-10 mt-2" />
                </template>
                <template v-else>
                  <span v-if="isConnected" class="text-3xl font-medium">
                    {{
                      formatEtherNoRound(
                        !totalClaimed.isNaN() ? totalClaimed.toString() : '0'
                      )
                    }}
                  </span>
                  <span v-if="!isConnected" class="text-3xl font-medium">
                    --
                  </span>
                  <Ticker />
                </template>
              </div>
            </div>

            <div
              class="flex justify-between items-start lg:items-center flex-col lg:grid lg:grid-cols-2 lg:gap-2 mb-2 lg:mb-0"
            >
              <div
                class="mb-4 lg:mb-0 flex flex-col justify-start border-l-4 border-cyan-600 pl-3 flex-shrink-0"
              >
                <h3 class="text-sm">Total claimable rewards</h3>
                <template v-if="stakingRewardsPending || relayRewardsPending">
                  <USkeleton class="w-[10rem] h-10 mt-2" />
                </template>
                <template v-else>
                  <span v-if="isConnected" class="text-3xl font-medium">
                    {{
                      formatEtherNoRound(
                        !totalClaimable.isNaN()
                          ? totalClaimable.toString()
                          : '0'
                      )
                    }}
                  </span>
                  <span v-if="!isConnected" class="text-3xl font-medium">
                    --
                  </span>
                  <Ticker class="text-sm" />
                </template>
              </div>

              <div
                v-if="isConnected"
                class="redeem flex gap-6 items-center flex-shrink-0 justify-end"
              >
                <div class="divider hidden lg:visible"></div>
                <div>
                  <UButton
                    :disabled="!hasClaimableRewards || isRedeemLoading"
                    @click="handleClaimAllRewards"
                    class="mb-2"
                    variant="outline"
                    color="cyan"
                    size="xl"
                  >
                    <span v-if="isRedeemLoading">Processing...</span>
                    <span v-else-if="hasClaimableRewards">Claim Rewards</span>
                    <span v-else>Nothing to claim</span>
                  </UButton>
                  <div v-if="progressLoading" class="text-center">
                    <UProgress animation="carousel">
                      <template #indicator="{ progressLoading }">
                        <div class="text-center">
                          <span v-if="progressLoading === 1" class="text-xs">
                            1 / 2 Accepting Request...
                          </span>
                          <span v-else class="text-xs">
                            2 / 2 Accepting Request...
                          </span>
                        </div>
                      </template>
                    </UProgress>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <Card title="Your Relays" icon="eos-icons:product-classes-outlined">
            <div class="flex flex-col lg:grid grid-cols-3 gap-10 mt-10">
              <div
                class="mb-4 flex flex-col border-l-4 border-cyan-600 lg:my-0 pl-3 h-full"
              >
                <div class="flex items-center gap-1">
                  <h3 class="text-sm">Registered</h3>
                  <Popover
                    placement="top"
                    :arrow="false"
                    class="h-max grid place-items-center"
                  >
                    <template #content>
                      <span class="text-xs font-normal">
                        Total Relays that are referenced to this wallet,
                        regardless of state.
                      </span>
                    </template>
                    <template #trigger>
                      <Icon name="heroicons:exclamation-circle" />
                    </template>
                  </Popover>
                </div>
                <div class="inline-flex flex-col items-baseline">
                  <template v-if="registeredCountPending">
                    <USkeleton class="w-[6rem] h-10" />
                  </template>
                  <template v-else>
                    <span v-if="isConnected" class="text-4xl font-medium">
                      {{ registeredCount }}
                    </span>
                    <span v-if="!isConnected" class="text-4xl font-medium">
                      --
                    </span>
                  </template>
                </div>
              </div>
              <div
                class="mb-4 flex flex-col border-l-4 border-cyan-600 lg:my-0 pl-3 h-full"
              >
                <div class="flex items-center gap-1">
                  <h3 class="text-sm">Hardware</h3>
                  <Popover
                    placement="top"
                    :arrow="false"
                    class="h-max grid place-items-center"
                  >
                    <template #content>
                      <span class="text-xs font-normal">
                        Total Anyone Hardware Relays.
                      </span>
                    </template>
                    <template #trigger>
                      <Icon name="heroicons:exclamation-circle" />
                    </template>
                  </Popover>
                </div>
                <div class="inline-flex flex-col items-baseline">
                  <template v-if="hardwareCountPending">
                    <USkeleton class="w-[6rem] h-10" />
                  </template>
                  <template v-else>
                    <span v-if="isConnected" class="text-4xl font-medium">
                      {{ hardwareCount }}
                    </span>
                    <span v-if="!isConnected" class="text-4xl font-medium">
                      --
                    </span>
                  </template>
                </div>
              </div>
              <div
                class="mb-4 flex flex-col border-l-4 border-cyan-600 lg:my-0 pl-3 h-full"
              >
                <div class="flex items-center gap-1">
                  <h3 class="text-sm">Locked</h3>
                  <Popover
                    placement="top"
                    :arrow="false"
                    class="h-max grid place-items-center"
                  >
                    <template #content>
                      <span class="text-xs font-normal">
                        Total Relays that are <strong>Locked</strong>.
                      </span>
                    </template>
                    <template #trigger>
                      <Icon name="heroicons:exclamation-circle" />
                    </template>
                  </Popover>
                </div>
                <div class="inline-flex flex-col items-baseline">
                  <template v-if="lockedCountPending">
                    <USkeleton class="w-[6rem] h-10" />
                  </template>
                  <template v-else>
                    <span v-if="isConnected" class="text-4xl font-medium">
                      {{ lockedCount }}
                    </span>
                    <span v-if="!isConnected" class="text-4xl font-medium">
                      --
                    </span>
                  </template>
                </div>
              </div>
              <div
                class="mb-4 flex flex-col border-l-4 border-cyan-600 lg:my-0 pl-3 h-full"
              >
                <div class="flex items-center gap-1">
                  <h3 class="text-sm">Claimed</h3>
                  <Popover
                    placement="top"
                    :arrow="false"
                    class="h-max grid place-items-center"
                  >
                    <template #content>
                      <span class="text-xs font-normal">
                        Total Relays that are <strong>Claimed</strong>.
                      </span>
                    </template>
                    <template #trigger>
                      <Icon name="heroicons:exclamation-circle" />
                    </template>
                  </Popover>
                </div>
                <div class="inline-flex flex-col items-baseline">
                  <template v-if="claimedCountPending">
                    <USkeleton class="w-[6rem] h-10" />
                  </template>
                  <template v-else>
                    <span v-if="isConnected" class="text-4xl font-medium">
                      {{ claimedCount }}
                    </span>
                    <span v-if="!isConnected" class="text-4xl font-medium">
                      --
                    </span>
                  </template>
                </div>
              </div>
              <div
                class="mb-4 flex flex-col border-l-4 border-cyan-600 lg:my-0 pl-3 h-full"
              >
                <div class="flex items-center gap-1">
                  <h3 class="text-sm">Active</h3>
                  <Popover
                    placement="top"
                    :arrow="false"
                    class="h-max grid place-items-center"
                  >
                    <template #content>
                      <span class="text-xs font-normal">
                        Total Relays that are <strong>Locked</strong> or
                        <strong>Hardware</strong> and <strong>Claimed</strong>.
                        Only the <strong>Active Relays</strong> earns rewards.
                      </span>
                    </template>
                    <template #trigger>
                      <Icon name="heroicons:exclamation-circle" />
                    </template>
                  </Popover>
                </div>
                <div class="inline-flex flex-col items-baseline">
                  <template v-if="activeCountPending">
                    <USkeleton class="w-[6rem] h-10" />
                  </template>
                  <template v-else>
                    <span v-if="isConnected" class="text-4xl font-medium">
                      {{ activeCount }}
                    </span>
                    <span v-if="!isConnected" class="text-4xl font-medium">
                      --
                    </span>
                  </template>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </DashboardMobileSection>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import { useUserStore } from '@/stores/useUserStore';
import DashboardMobileSection from '@/components/DashboardMobileSection.vue';
import Button from '@/components/ui-kit/Button.vue';
import Card from '@/components/ui-kit/Card.vue';
import Ticker from '@/components/ui-kit/Ticker.vue';
import { formatEtherNoRound, calculateAirdrop } from '@/utils/format';
import Popover from '../components/ui-kit/Popover.vue';
import { calculateBalance } from '@/composables/utils/useRelaysBalanceCheck';
import { useRelayRewards } from '@/composables/relay-rewards';
import { initHodler, useHodler } from '~/composables/hodler';
import { hodlerAbi } from '../assets/abi/hodler';
import BigNumber from 'bignumber.js';
import { parseEther } from 'viem';
import { getBlock } from '@wagmi/core';
import { useQuery } from '@tanstack/vue-query';
import { RouterLink } from 'vue-router';
import {
  useRelayMetricsQueries,
  useHardwareRelaysCountQuery,
} from '~/composables/queries/useRelayQueries';
import {
  useLockedRelaysQuery,
  useLockedRelaysCountQuery,
} from '~/composables/queries/useLockedRelaysQuery';
import { useHyperbeamFlag } from '~/composables/useHyperbeamFlag';

const userStore = useUserStore();
const hodlerStore = useHolderStore();
const { isConnected, address } = useAccount({ config } as any);
const isRedeemLoading = ref(false);
const progressLoading = ref(0);

const runtimeConfig = useRuntimeConfig();
const hodlerContract = runtimeConfig.public.hodlerContract as `0x${string}`;

const toast = useToast();

const { tokenBalance } = storeToRefs(userStore);

const redeemLabel = computed(() => {
  if (totalVaultClaimable.value.gt(0)) {
    return `Redeem ${formatEtherNoRound(totalVaultClaimable.value.toString())} from vaults`;
  }
  return 'Nothing to redeem';
});

// Initialize relay metrics queries with TanStack Query
const {
  relayInfoQuery,
  allRelaysQuery,
  hardwareStatusQuery,
  registeredCountQuery,
  hardwareCountQuery,
  claimedCountQuery,
  isPending: relayDataPending,
} = useRelayMetricsQueries(address);

// Initialize locked relays query
const lockedRelaysQuery = useLockedRelaysQuery(address);

// Compute locked count separately
// This includes both owned and delegated locks
const lockedCount = computed(() => {
  const locks = processedLocks.value;

  if (!locks) return 0;

  // Count all locks (both owned and delegated)
  return Object.keys(locks).length;
});

const lockedCountPending = computed(
  () => isConnected.value && locksPending.value
);

// Active relays count (hardware/locked that are claimed)
const activeCount = computed(() => {
  const locks = processedLocks.value;
  const hardwareStatus = hardwareStatusQuery.value;
  const allRelays = allRelaysQuery.value;

  if (!allRelays || (!locks && !hardwareStatus)) return 0;

  return allRelays.filter((relay) => {
    const isHardware = hardwareStatus[relay.fingerprint];
    const isLocked = locks ? locks[relay.fingerprint] !== undefined : false;

    if (isHardware) {
      return relay.active && relay.status === 'verified';
    } else {
      return relay.active && relay.status === 'verified' && isLocked;
    }
  }).length;
});

const activeCountPending = computed(
  () => isConnected.value && (relayDataPending.value || locksPending.value)
);

// Pending states - only show loading when connected
const registeredCountPending = computed(
  () => isConnected.value && relayDataPending.value
);
const hardwareCountPending = computed(
  () => isConnected.value && relayDataPending.value
);
const claimedCountPending = computed(
  () => isConnected.value && relayDataPending.value
);

// Expose values as computed
const registeredCount = registeredCountQuery;
const hardwareCount = hardwareCountQuery;
const claimedCount = claimedCountQuery;

const hasEnoughBalance = ref(false);
const hasEnoughBalancePending = ref(true);

// Watch allRelays for balance check
watch(allRelaysQuery, async (allRelays) => {
  if (!allRelays || !address.value) return;
  hasEnoughBalancePending.value = true;
  hasEnoughBalance.value = await calculateBalance(allRelays, address.value);
  hasEnoughBalancePending.value = false;
});

// Refresh hodler when address changes
watch(address, async (newAddress) => {
  if (!newAddress) return;
  try {
    await useHodler()?.refresh();
  } catch (error) {
    console.error('Error refreshing hodler on address change:', error);
  }
});

// Initialize on mount
onMounted(async () => {
  try {
    initHodler();
    await Promise.all([
      userStore.getTokenBalance(),
      useRelayRewards().refresh(),
      useHodler()?.refresh(),
    ]);
  } catch (error) {
    console.error('Error during onMounted execution', error);
  }
});

const { hyperbeamEnabled } = useHyperbeamFlag();
const isHyperbeamEnabled = computed(() => hyperbeamEnabled.value);

const {
  data: stakingRewards,
  isPending: stakingRewardsPendingRaw,
  refetch: refetchStakingRewards,
} = useQuery({
  queryKey: computed(() => [
    'claimableRewards',
    address.value,
    isHyperbeamEnabled.value,
  ]),
  queryFn: async () => {
    if (!address.value) return '0';

    return getTotalClaimableStakingRewards(address.value);
  },
  enabled: computed(() => !!address.value),
});

const stakingRewardsPending = computed(
  () => isConnected.value && stakingRewardsPendingRaw.value
);

// Fetch airdrop data from Supabase
const { data: airdropData, isPending: airdropPendingRaw } = useQuery({
  queryKey: ['airdropTokens', address],
  queryFn: async () => {
    if (!address.value) return '0';

    const runtimeConfig = useRuntimeConfig();
    const AIRDROP_API_URL = runtimeConfig.public.airdropApi;
    const VARIATION_API_URL = runtimeConfig.public.variationApi;

    try {
      const [airdropResponse, variationResponse] = await Promise.all([
        fetch(AIRDROP_API_URL),
        fetch(VARIATION_API_URL),
      ]);

      const airdropDataArray = await airdropResponse.json();
      const variationDataArray = await variationResponse.json();

      const userAirdrop = airdropDataArray.find(
        (entry: { id: string; airdrop: number }) =>
          entry.id.toLowerCase() === address.value?.toLowerCase()
      );

      const variation = variationDataArray.find(
        (entry: { id: string; variation: number }) =>
          entry.id.toLowerCase() === address.value?.toLowerCase()
      );

      const airDropValue = new BigNumber(userAirdrop?.airdrop ?? '0');
      const variationValue = new BigNumber(variation?.variation ?? '0');
      const result = airDropValue.minus(variationValue).toString();

      return result;
    } catch (error) {
      console.error('Error fetching airdrop data:', error);
      return '0';
    }
  },
  enabled: computed(() => !!address.value),
});

const airdropPending = computed(
  () => isConnected.value && airdropPendingRaw.value
);

const hasClaimedStakingRewards = computed(() => {
  if (!hodlerInfo.value) return false;
  return new BigNumber(hodlerInfo.value[5].toString() || '0').isGreaterThan(0);
});

const {
  data: hodlerInfo,
  isPending: hodlerInfoPendingRaw,
  refetch: refetchHolderInfo,
} = useReadContract({
  address: hodlerContract,
  abi: hodlerAbi,
  functionName: 'hodlers',
  args: [computed(() => address.value as `0x${string}`)],
  query: {
    enabled: computed(() => !!address.value),
  },
});

const hodlerInfoPending = computed(
  () => isConnected.value && hodlerInfoPendingRaw.value
);

// Total claimed tokens for airdrop calculation (claimedRelayRewards only)
const totalClaimedForAirdrop = computed(() => {
  if (!hodlerInfo.value) return '0';
  return new BigNumber(hodlerInfo.value[4].toString() || '0')
    .dividedBy(Math.pow(10, 18))
    .toString();
});

// Calculate airdrop eligibility
const calculatedAirdrop = computed(() => {
  if (!totalClaimedForAirdrop.value || !airdropData.value) return '0';

  const baseAirdrop = calculateAirdrop(
    totalClaimedForAirdrop.value,
    airdropData.value
  );

  // Apply 10% bonus if user has claimable staking rewards
  if (hasClaimedStakingRewards.value) {
    return new BigNumber(baseAirdrop).multipliedBy(1.1).toString(10);
  } else {
    return baseAirdrop;
  }
});

const handleClaimAllRewards = async () => {
  isRedeemLoading.value = true;
  progressLoading.value = 1;

  try {
    const hodler = useHodler();

    if (!hodler) {
      throw new Error('Hodler not initialized');
    }

    const response = await hodler.claim();
    if (response) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.add({
        icon: 'i-heroicons-check-circle',
        color: 'green',
        title: 'Success',
        description: 'Rewards redeemed successfully',
      });
    } else {
      throw new Error('No response from claim');
    }
  } catch (error) {
    toast.add({
      icon: 'i-heroicons-x-circle',
      color: 'red',
      title: 'Error',
      description: `Error redeeming rewards`,
    });
  } finally {
    setTimeout(() => {
      refetchHolderInfo();
      refetchStakingRewards();
      refetchRelayRewards();
    }, 1000);

    isRedeemLoading.value = false;
    progressLoading.value = 0;
  }
};

const withdrawInput = ref('');
const withdrawAmount = computed(
  () => validateTokenInput(withdrawInput.value) || '0'
);
const isWithdrawing = computed(
  () =>
    (currentWriteAction.value === 'withdraw' && writePending.value) ||
    isConfirming.value
);
const withdrawDialogOpen = ref(false);
const totalVaultClaimable = ref<BigNumber>(new BigNumber(0));
const currentWriteAction = ref<'withdraw' | 'openExpired' | null>(null);

const { getTotalClaimableStakingRewards, claimStakingRewards } =
  useStakingRewards();

const {
  data: hash,
  isPending: writePending,
  writeContractAsync,
} = useWriteContract();
const { isLoading: isConfirming, isSuccess: isConfirmed } =
  useWaitForTransactionReceipt({
    hash,
  });

watch(isConfirmed, (confirmed) => {
  if (confirmed) {
    if (currentWriteAction.value === 'withdraw') {
      toast.remove('withdraw');
      toast.add({
        title: `Withdrew ${withdrawAmount.value} tokens`,
        color: 'green',
      });
      withdrawInput.value = '';
      withdrawDialogOpen.value = false;
      refetchHolderInfo();
    } else if (currentWriteAction.value === 'openExpired') {
      toast.remove('openExpired');
      toast.add({
        title: `Successfully redeemed ${formatEtherNoRound(totalVaultClaimable.value.toString())} tokens from expired vaults`,
        color: 'green',
      });
      refetchVaults();
      refetchHolderInfo();
    }
    currentWriteAction.value = null;
  }
});

const totalClaimable = computed(() => {
  if (!hodlerInfo.value) return BigNumber(0);
  return new BigNumber(stakingRewards.value?.toString() || '0').plus(
    new BigNumber(relayRewards.value?.toString() || '0')
  );
});

const totalClaimed = computed(() => {
  if (!hodlerInfo.value) return BigNumber(0);
  return new BigNumber(hodlerInfo.value[4].toString() || '0').plus(
    new BigNumber(hodlerInfo.value[5].toString() || '0')
  );
});

const hasClaimableRewards = computed(() => {
  if (!hodlerInfo.value) return false;
  return totalClaimable.value.isGreaterThan(0);
});

const availableTokens = computed(() => {
  if (!hodlerInfo.value) return BigNumber(0);
  return new BigNumber(hodlerInfo.value[0].toString() || '0');
});

const {
  data: stakesData,
  isLoading: stakesPendingRaw,
  error,
  refetch: refetchStakes,
} = useReadContract({
  address: hodlerContract,
  abi: hodlerAbi,
  functionName: 'getStakes',
  args: [computed(() => address.value as `0x${string}`)],
  query: {
    enabled: computed(() => !!address.value),
  },
});

const stakesPending = computed(
  () => isConnected.value && stakesPendingRaw.value
);

const totalStaked = computed(() => {
  if (!stakesData.value) return BigNumber(0);

  return stakesData.value.reduce((acc, stake) => {
    const amount = new BigNumber(stake.amount.toString() || '0');
    return acc.plus(amount);
  }, new BigNumber(0));
});

const {
  data: vaultsData,
  isPending: vaultsPendingRaw,
  refetch: refetchVaults,
} = useReadContract({
  address: hodlerContract,
  abi: hodlerAbi,
  functionName: 'getVaults',
  args: [computed(() => address.value as `0x${string}`)],
  query: {
    enabled: computed(() => !!address.value),
  },
});

const {
  data: locksData,
  isPending: locksPendingRaw,
  refetch: refetchLocks,
} = useReadContract({
  address: hodlerContract,
  abi: hodlerAbi,
  functionName: 'getLocks',
  args: [computed(() => address.value as `0x${string}`)],
  query: {
    enabled: computed(() => !!address.value),
  },
});

const vaultsPending = computed(
  () => isConnected.value && vaultsPendingRaw.value
);

const locksPending = computed(() => isConnected.value && locksPendingRaw.value);

// Transform locks data from raw contract return to processed format
const processedLocks = computed(() => {
  if (!locksData.value) return {};

  const locksResult: Record<
    string,
    { fingerprint: string; operator: string; amount: string }
  > = {};

  for (let i = 0; i < locksData.value.length; i++) {
    const lock = locksData.value[i];
    const fingerprint = lock.fingerprint as string;
    const operator = lock.operator as string;
    const amount = new BigNumber(lock.amount.toString())
      .dividedBy(Math.pow(10, 18))
      .toFixed(3);
    locksResult[fingerprint] = {
      fingerprint,
      operator,
      amount,
    };
  }

  return locksResult;
});

// Calculate total locked tokens from processed locks
const totalLockedTokens = computed(() => {
  const locks = processedLocks.value;
  return Object.values(locks).reduce((acc, lock) => {
    return acc.plus(new BigNumber(lock.amount));
  }, new BigNumber(0));
});

const totalVaulted = computed(() => {
  if (!vaultsData.value) return BigNumber(0);

  return vaultsData.value.reduce((acc, vault) => {
    const amount = new BigNumber(vault.amount.toString() || '0');
    return acc.plus(amount);
  }, new BigNumber(0));
});

watch(vaultsData, async (vaults) => {
  if (vaults) {
    updateTotalClaimable();
  }
});

onMounted(() => {
  if (vaultsData.value) {
    updateTotalClaimable();
  }
});

const updateTotalClaimable = async () => {
  console.log('Updating total claimable vaults...');
  if (!vaultsData.value?.length) {
    totalVaultClaimable.value = new BigNumber(0);
    return;
  }

  let total = 0n;
  await Promise.all(
    vaultsData.value.map(async (vault) => {
      const isClaimable = await claimable(vault.availableAt);
      if (isClaimable) total += vault.amount;
    })
  );
  totalVaultClaimable.value = BigNumber(total.toString());
};

const totalContract = computed(() => {
  if (!hodlerInfo.value) return BigNumber(0);

  const available = new BigNumber(hodlerInfo.value[0].toString() || '0');
  const totalLocked = totalLockedTokens.value.multipliedBy(
    new BigNumber(10).pow(18)
  );

  return available.plus(
    totalVaulted.value.plus(totalStaked.value).plus(totalLocked)
  );
});

const isPending = computed(() => {
  if (!isConnected.value) return false;

  return (
    hodlerInfoPending.value ||
    vaultsPending.value ||
    locksPending.value ||
    lockedRelaysQuery.isPending.value ||
    stakesPending.value
  );
});

const claimable = async (available: bigint) => {
  const TIMESTAMP_BUFFER = 15 * 60;
  const block = await getBlock(config);
  const timestamp = block.timestamp;
  return available < timestamp - BigInt(TIMESTAMP_BUFFER);
};

const isRedeemingTokens = computed(
  () => writePending.value && currentWriteAction.value === 'openExpired'
);
const redeemTokens = async (available: bigint) => {
  if (!isConnected) {
    toast.add({
      title: 'Please connect your wallet to claim tokens',
      color: 'red',
    });
    return;
  }
  if (totalVaultClaimable.value.isZero()) {
    toast.add({
      title: `No tokens to redeem from vaults`,
      color: 'red',
    });
    return;
  }
  try {
    currentWriteAction.value = 'openExpired';
    toast.add({
      id: 'openExpired',
      title: `Redeeming ${formatEtherNoRound(totalVaultClaimable.value.toString())} tokens from expired vaults...`,
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

watch(withdrawDialogOpen, (open) => {
  if (!open) {
    handleCloseWithdrawDialog();
  }
});

const handleCloseWithdrawDialog = () => {
  if (isWithdrawing.value) {
    toast.add({
      id: 'withdraw',
      title: `Withdrawing ${withdrawAmount.value} available tokens...`,
      color: 'blue',
      timeout: 0,
    });
  } else {
    withdrawInput.value = '';
  }
  withdrawDialogOpen.value = false;
};

const setMaxWithdraw = () => {
  if (!availableTokens.value.isZero()) {
    withdrawInput.value = formatEtherNoRound(availableTokens.value.toString());
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

  if (!withdrawAmount.value || Number(withdrawAmount.value) <= 0) {
    toast.add({
      title: 'Enter a valid withdraw amount',
      color: 'red',
    });
    return;
  }

  try {
    currentWriteAction.value = 'withdraw';
    const amount = parseEther(withdrawAmount.value);

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

const relayRewardsProcessId = runtimeConfig.public.relayRewardsProcessId;
const noClaimableData = ref(false);

// Get-Rewards: Claimable relay rewards

const getClaimableRelayRewardsDryRun = async (
  addr: string
): Promise<BigNumber> => {
  const { result } = await sendAosDryRun({
    processId: relayRewardsProcessId,
    tags: [
      { name: 'Action', value: 'Get-Rewards' },
      { name: 'Address', value: addr },
    ],
  });

  if (!result?.Messages[0]?.Data) {
    noClaimableData.value = true;
    return new BigNumber(0);
  }

  noClaimableData.value = false;
  const claimable = new BigNumber(result?.Messages[0].Data);
  console.log('claimable relay rewards: ', claimable);
  return claimable;
};

const getClaimableRelayRewardsHyperbeam = async (
  addr: string
): Promise<BigNumber> => {
  const processId = runtimeConfig.public.relayRewardsHyperbeamProcessId;
  const scriptTxId = runtimeConfig.public.relayDynamicViews;
  const hyperbeamUrl = runtimeConfig.public.hyperbeamUrl;
  const url = `${hyperbeamUrl}/${processId}~process@1.0/now/~lua@5.3a&module=${scriptTxId}/get_rewards?address=${`0x${addr.slice(2).toUpperCase()}` as `0x${string}`}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch claimable rewards: ${response.statusText}`
    );
  }

  const data = await response.json();
  const claimable = new BigNumber(data || '0');
  console.log('claimable relay rewards (hyperbeam): ', claimable);
  return claimable;
};

const {
  data: claimableData,
  isPending: claimableDataPending,
  refetch: refetchClaimableRelayRewards,
} = useQuery({
  queryKey: computed(() => [
    'claimableRelayRewards',
    address.value,
    isHyperbeamEnabled.value,
  ]),
  queryFn: async () => {
    if (!address.value) return new BigNumber(0);

    if (isHyperbeamEnabled.value) {
      return await getClaimableRelayRewardsHyperbeam(address.value);
    } else {
      return await getClaimableRelayRewardsDryRun(address.value);
    }
  },
  enabled: computed(() => !!address.value),
});

// Get-Claimed: Already claimed relay rewards

const getClaimedRelayRewardsDryRun = async (
  addr: string
): Promise<BigNumber> => {
  const { result } = await sendAosDryRun({
    processId: relayRewardsProcessId,
    tags: [
      { name: 'Action', value: 'Get-Claimed' },
      { name: 'Address', value: addr },
    ],
  });
  console.log('getClaimedRelayRewards result: ', result);
  if (!result?.Messages[0]?.Data) {
    return new BigNumber(0);
  }

  const data = JSON.parse(result?.Messages[0]?.Data);
  const claimed = new BigNumber(data || '0');
  console.log('claimed relay rewards: ', claimed.toString());
  return claimed;
};

const getClaimedRelayRewardsHyperbeam = async (
  addr: string
): Promise<BigNumber> => {
  const processId = runtimeConfig.public.relayRewardsHyperbeamProcessId;
  const scriptTxId = runtimeConfig.public.relayDynamicViews;
  const hyperbeamUrl = runtimeConfig.public.hyperbeamUrl;
  const url = `${hyperbeamUrl}/${processId}~process@1.0/now/~lua@5.3a&module=${scriptTxId}/get_claimed?address=${`0x${addr.slice(2).toUpperCase()}` as `0x${string}`}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch claimed rewards: ${response.statusText}`);
  }

  let data;

  try {
    data = await response.json();
    console.log('claimed relay rewards hyper data: ', data);
  } catch (error) {
    console.error('Error formatting response data');
  }

  const claimed = new BigNumber(data || '0');
  console.log('claimed relay rewards (hyperbeam): ', claimed.toString());
  return claimed;
};

const {
  data: claimedData,
  isPending: claimedDataPending,
  refetch: refetchClaimedRelayRewards,
  isError: claimedDataError,
} = useQuery({
  queryKey: computed(() => [
    'claimedRelayRewards',
    address.value,
    isHyperbeamEnabled.value,
  ]),
  queryFn: async () => {
    if (!address.value) return new BigNumber(0);

    if (isHyperbeamEnabled.value) {
      return await getClaimedRelayRewardsHyperbeam(address.value);
    } else {
      return await getClaimedRelayRewardsDryRun(address.value);
    }
  },
  enabled: computed(() => !!address.value),
});

const refetchRelayRewards = () => {
  refetchClaimableRelayRewards();
  refetchClaimedRelayRewards();
};

const relayRewardsPending = computed(
  () =>
    isConnected.value &&
    (claimedDataPending.value || claimableDataPending.value)
);

const relayRewards = computed(() => {
  const rewarded = claimableData.value;
  const claimed = claimedData.value;

  // if there is an error getting claimed return 0
  if (!rewarded?.gt(0) || (claimedDataError.value && !noClaimableData.value))
    return new BigNumber(0);

  // if there is no data for claimed (0) then just show claimable
  if (!claimed?.gt(0)) return rewarded;

  const claimable = rewarded.minus(claimed);
  console.log('computed rewarded relay rewards: ', claimable?.toString());
  return claimable;
});
</script>

<style scoped>
.divider {
  width: 1px;
  min-height: 64px;
  height: 100%;
  background: linear-gradient(
    0deg,
    rgba(22, 81, 103, 0) 0%,
    #165167 49.5%,
    rgba(22, 81, 103, 0) 100%
  );
}

.redeem {
  height: 100%;
}
</style>
