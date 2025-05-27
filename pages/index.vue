<template>
  <div
    class="relative grid grid-flow-row grid-cols-1 pt-4 lg:pt-0 gap-6 lg:grid-cols-6 mt-4"
  >
    <div class="flex w-full flex-col gap-4 lg:col-span-6">
      <DashboardMobileSection title="account-balance">
        <Card title="Account Balance" :icon="'eos-icons:master-outlined'">
          <div
            class="flex justify-between items-start lg:items-center flex-col lg:flex-row mb-2 lg:mb-0"
          >
            <p class="mb-4 text-sm">
              The connected wallet shows the following balance:
            </p>
          </div>

          <div class="flex gap-5 lg:gap-32 flex-col lg:flex-row my-4">
            <div class="border-l-4 border-cyan-600 pl-3">
              <UserBalance
                class="bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-6xl font-bold text-transparent drop-shadow-lg dark:from-gray-200 dark:to-gray-500"
              >
                <Ticker />
              </UserBalance>
            </div>
            <div class="flex gap-0 lg:gap-32 flex-col lg:flex-row">
              <div class="my-4 flex flex-col border-l-4 border-cyan-600 pl-3">
                <h3>
                  <Icon name="material-symbols:lock" />
                  Locked
                </h3>
                <div class="inline-flex items-baseline gap-2">
                  <template v-if="lockedPending">
                    <USkeleton class="w-[15rem] h-10" />
                  </template>
                  <template v-else>
                    <span v-if="isConnected" class="text-4xl font-bold">
                      {{ Number(hodlerStore.lockedTokens).toFixed(2) }}
                    </span>
                    <span v-if="!isConnected" class="text-4xl font-bold">
                      --
                    </span>
                    <Ticker />
                  </template>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </DashboardMobileSection>

      <DashboardMobileSection title="my-rewards">
        <Card title="Rewards History" icon="eos-icons:trusted-organization">
          <div
            class="flex justify-between items-start lg:items-center flex-col lg:flex-row mb-2 lg:mb-0"
          >
            <p class="mb-4 text-sm">
              Earn rewards by contributing relays to the ANYONE network.
              <a
                href="https://docs.anyone.io/rewards"
                target="_blank"
                class="dark:text-cyan-200 text-cyan-500 underline"
              >
                Find Out More
              </a>
            </p>
            <div v-if="isConnected" class="redeem flex gap-6 items-center">
              <div class="divider hidden lg:visible"></div>
              <div>
                <Button
                  :disabled="
                    !hodlerStore.hasClaimableRewards || isRedeemLoading
                  "
                  @onClick="handleClaimAllRewards"
                  class="mb-2"
                >
                  <span v-if="isRedeemLoading">Processing...</span>
                  <span v-else-if="hodlerStore.hasClaimableRewards"
                    >Redeem Rewards</span
                  >
                  <span v-else>Nothing to Redeem</span>
                </Button>
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

          <div class="flex gap-0 lg:gap-32 flex-col lg:flex-row">
            <div class="my-4 flex flex-col border-l-4 border-cyan-600 pl-3">
              <div class="flex flex-col items-start gap-2">
                <h3>Total redeemed rewards</h3>
              </div>
              <template v-if="claimedPending">
                <USkeleton class="w-[15rem] h-10 mt-2" />
              </template>
              <template v-else>
                <span v-if="isConnected" class="text-4xl font-bold">
                  {{
                    formatEtherNoRound(
                      hodlerStore?.claimData?.totalClaimed || '0'
                    )
                  }}
                </span>
                <span v-if="!isConnected" class="text-4xl font-bold"> -- </span>
                <Ticker />
              </template>
            </div>

            <div
              class="my-4 flex flex-col justify-end border-l-4 border-cyan-600 pl-3"
            >
              <div class="flex items-start gap-2">
                <h3>Eligible for next airdrop</h3>
                <Popover placement="top" :arrow="false">
                  <template #content>
                    <div
                      class="text-xs font-normal text-gray-600 dark:text-gray-300"
                    >
                      Total number of redeemed tokens, minus any tokens received
                      or forfeited from previous airdrops.
                    </div>
                  </template>
                  <template #trigger>
                    <div>
                      <div
                        class="-mt-6 cursor-context-menu hover:text-[#24adc3]"
                      >
                        <Icon name="heroicons:exclamation-circle" />
                      </div>
                    </div>
                  </template>
                </Popover>
              </div>
              <template v-if="calculatedAirdropPending">
                <USkeleton class="w-[15rem] h-10 mt-2" />
              </template>
              <template v-else>
                <span v-if="isConnected" class="text-4xl font-bold">
                  {{ formatEtherNoRound(hodlerStore.calculatedAirdrop || '0') }}
                </span>
                <span v-if="!isConnected" class="text-4xl font-bold"> -- </span>
                <Ticker />
                <div
                  v-if="!hasEnoughBalancePending && !hasEnoughBalance"
                  class="flex items-center gap-2 mt-2"
                >
                  <span class="w-2 h-2 bg-red-600 rounded-full"></span>
                  <span>Mainnet balance too low</span>
                </div>
              </template>
            </div>

            <div
              class="my-4 flex flex-col justify-start border-l-4 border-cyan-600 pl-3"
            >
              <h3>Redeemable rewards</h3>
              <template v-if="claimablePending">
                <USkeleton class="w-[15rem] h-10 mt-2" />
              </template>
              <template v-else>
                <span v-if="isConnected" class="text-4xl font-bold">
                  {{
                    formatEtherNoRound(
                      hodlerStore.claimData?.totalClaimable || '0'
                    )
                  }}
                </span>
                <span v-if="!isConnected" class="text-4xl font-bold"> -- </span>
                <Ticker />
              </template>
            </div>
          </div>
        </Card>
      </DashboardMobileSection>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAccount } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import { useUserStore } from '@/stores/useUserStore';
// import { useRegistratorStore } from '@/stores/useRegistratorStore';
import DashboardMobileSection from '@/components/DashboardMobileSection.vue';
import UserBalance from '@/components/UserBalance.vue';
import Button from '@/components/ui-kit/Button.vue';
import Card from '@/components/ui-kit/Card.vue';
import Ticker from '@/components/ui-kit/Ticker.vue';
import { initRegistrator, useRegistrator } from '@/composables/registrator';
import { useFacilitator } from '@/composables/facilitator';
import { useDistribution } from '@/composables/distribution';
import { initFacilitator } from '@/composables/facilitator';
import { initToken } from '@/composables/token';
import { formatEtherNoRound, calculateAirdrop } from '@/utils/format';
import Popover from '../components/ui-kit/Popover.vue';
import { calculateBalance } from '@/composables/utils/useRelaysBalanceCheck';
import { useRelayRewards } from '@/composables/relay-rewards';
import { formatUnits } from 'viem';
import { initHodler, useHodler } from '~/composables/hodler';

const userStore = useUserStore();
// const registratorStore = useRegistratorStore();
const hodlerStore = useHolderStore();
const { isConnected, address } = useAccount({ config } as any);
const { allRelays } = storeToRefs(userStore);

const isRedeemLoading = ref(false);
const progressLoading = ref(0);
const lockedPending = ref(false);
const claimedPending = ref(true);
const claimablePending = ref(true);

const toast = useToast();

const isLoading = ref(true);

const { error: allRelaysError, pending: allRelaysPending } = useAsyncData(
  'verifiedRelays',
  () => userStore.createRelayCache(),
  {
    server: false,
    watch: [address],
  }
);
const { tokenBalance } = storeToRefs(userStore);

const {
  locks: lockedRelays,
  loading: lockedRelaysPending,
  lockedTokens,
} = storeToRefs(hodlerStore);
const hasEnoughBalance = ref(false);
const hasEnoughBalancePending = ref(true);

watch(
  [allRelays, allRelaysPending, address],
  async ([allRelays, allRelaysPending, address]) => {
    if (!allRelays || allRelaysPending || !address) return;
    hasEnoughBalancePending.value = true;
    hasEnoughBalance.value = await calculateBalance(allRelays, address);

    // add timeout before updating
    await new Promise((resolve) => setTimeout(resolve, 2000));
    hasEnoughBalancePending.value = false;
  }
);

const fetchInitialData = async (
  newAddress: string | undefined,
  forceRefresh = false
) => {
  if (!isConnected || !newAddress || !address) return;

  try {
    if (!hodlerStore?.initialized || forceRefresh) {
      lockedPending.value = true;
      claimedPending.value = true;
      claimablePending.value = true;
    }

    await Promise.all([
      userStore.getTokenBalance(),
      (!hodlerStore?.initialized || forceRefresh) && useHodler()?.refresh(),
      useRelayRewards().refresh(),
      useDistribution().airdropTokens(newAddress as string),
    ]);
  } catch (error) {
    console.error(error);
  } finally {
    //wait 1 second before setting pending to false
    lockedPending.value = false;
    claimedPending.value = false;
    claimablePending.value = false;
  }
};

onMounted(async () => {
  isLoading.value = true;

  try {
    // await initDistribution();
    // initRelayRegistry();
    initHodler();
    // add 5 seconds delay
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await fetchInitialData(userStore.userData.address);
  } catch (error) {
    console.error('Error during onMounted execution', error);
  } finally {
    isLoading.value = false;
  }
});

watch(
  () => userStore.userData.address,
  async (newAddress?: string) => {
    await fetchInitialData(newAddress, true);
  }
);

// watch(
//   () => facilitatorStore.pendingClaim,
//   (updatedPendingClaim) => {
//     progressLoading.value = updatedPendingClaim ? 2 : 0;
//   }
// );

const calculatedAirdropPending = ref(false);

//watch and do the calculate airdrop
watch(
  () => [hodlerStore.claimData.totalClaimed, hodlerStore.airDropTokens],
  ([totalClaimedTokens, airDropTokens]) => {
    calculatedAirdropPending.value = true;
    if (totalClaimedTokens && airDropTokens) {
      hodlerStore.calculatedAirdrop = calculateAirdrop(
        totalClaimedTokens,
        airDropTokens
      );
      calculatedAirdropPending.value = false;
    }
  }
);

const handleClaimAllRewards = async () => {
  isRedeemLoading.value = true;
  progressLoading.value = 1;

  try {
    const facilitator = useFacilitator();
    const response = await facilitator?.claim();
    if (response) {
      toast.add({
        icon: 'i-heroicons-check-circle',
        color: 'blue',
        title: 'Success',
        description:
          'Rewards redeemed successfully please wait for the transaction to be saved',
      });

      toast.add({
        icon: 'i-heroicons-information-circle',
        color: 'blue',
        title: 'Please wait',
        description:
          'Please wait for the data to refresh, this may take a few seconds',
        timeout: 13000,
      });

      await new Promise((resolve) => setTimeout(resolve, 10000));

      await Promise.all([
        useRelayRewards().refreshAuthedUserClaimableTokens(),
        useDistribution().airdropTokens(userStore.userData.address as string),
      ]);

      toast.remove('Please wait');

      toast.add({
        icon: 'i-heroicons-check-circle',
        color: 'blue',
        title: 'Data refreshed',
        description: 'Data has been refreshed',
      });
    } else {
      // toast.add({
      //   icon: 'i-heroicons-x-circle',
      //   color: 'amber',
      //   title: 'Error',
      //   description: 'Error redeeming rewards',
      // });
    }
  } catch (error) {
    toast.add({
      icon: 'i-heroicons-x-circle',
      color: 'amber',
      title: 'Error',
      description: `Error redeeming rewards: ${error}`,
    });
  }

  isRedeemLoading.value = false;
  // facilitatorStore.pendingClaim = null;
  progressLoading.value = 0;
};
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
