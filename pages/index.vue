<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { initRelayRegistry } from '@/composables/relay-registry';
import { initFacilitator } from '@/composables/facilitator';
import { formatEther } from 'ethers';

import { useAccount } from 'use-wagmi';
import { config } from '@/config/wagmi.config';
import { useFacilitatorStore } from '@/stores/useFacilitatorStore';

import Card from '@/components/ui-kit/Card.vue';
import Ticker from '@/components/ui-kit/Ticker.vue';
import Button from '@/components/ui-kit/Button.vue';
import DataTableMyRelays from '@/components/DataTableMyRelays/DataTableMyRelays.vue';
import { useFacilitator } from '@/composables/facilitator';
import { getRedeemProcessSessionStorage } from '@/utils/redeemSessionStorage';
import { initRegistrator } from '@/composables/registrator';
import { initToken } from '@/composables/token';

const userStore = useUserStore();
const facilitatorStore = useFacilitatorStore();
const { address } = storeToRefs(userStore);
const { isConnected } = useAccount({ config });
const isRedeemLoading = ref(false);
const toast = useToast();

// Initialize data fetch and cache
// Retrieve the user data and set state
// These auto refresh when the address changes
// const { refresh: claimedRefresh, error: claimedError } = await useAsyncData(
//   'claimed',
//   () => userStore.getClaimedRewardsTotal().then(() => true),
//   { watch: [address] }
// );
// const { refresh: claimableRefresh, error: claimableError } = await useAsyncData(
//   'claimable',
//   () => userStore.getClaimableRewards().then(() => true),
//   { watch: [address] }
// );

// Get new data every 5 minutes
onMounted(() => {
  // setInterval(
  //   () => {
  //     claimedRefresh();
  //     claimableRefresh();
  //   },
  //   1000 * 60 * 5
  // );

  facilitatorStore.pendingClaim = getRedeemProcessSessionStorage(
    userStore.userData.address
  );
});

initRelayRegistry();
initFacilitator();
initRegistrator();
initToken();

watch(
  () => userStore.userData.address,
  async (newAddress) => {
    facilitatorStore.pendingClaim = getRedeemProcessSessionStorage(newAddress);
    const facilitator = useFacilitator();
    await facilitator?.refresh();
    await userStore.getTokenBalance();
  }
);

const handleClaimAllRewards = async () => {
  isRedeemLoading.value = true;
  try {
    const facilitator = useFacilitator();
    await facilitator?.claim();
  } catch (error) {
    toast.add({
      icon: 'i-heroicons-x-circle',
      color: 'amber',
      title: 'Error',
      description: `Error redeen rewards: ${error}`,
    });
  }

  isRedeemLoading.value = false;
};
</script>

<template>
  <div
    class="relative grid grid-flow-row grid-cols-1 pt-4 lg:pt-0 gap-6 lg:grid-cols-6"
  >
    <div
      class="flex w-full flex-col gap-4 lg:flex-row lg:col-span-6 lg:flex-row-reverse"
    >
      <DashboardMobileSection class="lg:basis-1/2" title="account-balance">
        <Card title="Account balance" :icon="'eos-icons:master-outlined'">
          <p class="mb-4 text-sm">
            The connected wallet shows the following balance:
          </p>

          <div class="flex gap-32">
            <div class="border-l-4 border-cyan-600 pl-3">
              <UserBalance
                class="bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-6xl font-bold text-transparent drop-shadow-lg dark:from-gray-200 dark:to-gray-500"
              >
                <p class="ml-1 mt-2 text-sm"><Ticker /> Account balance</p>
              </UserBalance>
            </div>
            <div class="flex flex-col border-l-4 border-cyan-600 pl-3">
              <h3>
                <Icon name="material-symbols:lock" />
                Locked
              </h3>
              <div class="inline-flex items-baseline gap-2">
                <span v-if="isConnected" class="text-4xl font-bold">
                  {{
                    formatEther(
                      facilitatorStore.avaliableAllocatedTokens || '0'
                    )
                  }}
                </span>
                <span v-if="!isConnected" class="text-4xl font-bold"> -- </span>
                <Ticker />
              </div>
            </div>
          </div>
        </Card>
      </DashboardMobileSection>

      <DashboardMobileSection class="lg:basis-1/2" title="my-rewards">
        <Card>
          <div class="flex justify-between items-center">
            <div>
              <h2
                class="dark:text-cyan-200 lg:text-3xl text-2xl tracking-wide flex items-center gap-2 font-brand"
              >
                <Icon name="eos-icons:trusted-organization" />
                Rewards history
              </h2>
              <p class="mb-4 text-sm mt-4">
                Earn rewards by contributing relays to the ATOR network.
              </p>
            </div>
            <div v-if="isConnected" class="redeem flex gap-6 items-center">
              <div class="divider"></div>

              <Button
                :disabled="
                  !facilitatorStore.hasClaimableRewards ||
                  isRedeemLoading ||
                  !!facilitatorStore.pendingClaim
                "
                @onClick="handleClaimAllRewards"
              >
                <span v-if="isRedeemLoading || !!facilitatorStore.pendingClaim"
                  >Processing...</span
                >
                <span v-else-if="facilitatorStore.hasClaimableRewards"
                  >Redeem Rewards</span
                >
                <span v-else>Nothing to Redeem</span>
              </Button>
            </div>
          </div>

          <div class="flex gap-32">
            <div class="my-4 flex flex-col border-l-4 border-cyan-600 pl-3">
              <h3>Claimed rewards</h3>
              <div class="inline-flex items-baseline gap-2">
                <span v-if="isConnected" class="text-4xl font-bold">
                  {{ formatEther(facilitatorStore.totalClaimedTokens || '0') }}
                </span>
                <span v-if="!isConnected" class="text-4xl font-bold"> -- </span>
                <Ticker />
              </div>
            </div>
            <div class="my-4 flex flex-col border-l-4 border-cyan-600 pl-3">
              <h3>Claimable rewards</h3>
              <div class="inline-flex items-baseline gap-2">
                <span v-if="isConnected" class="text-4xl font-bold">
                  {{
                    formatEther(
                      facilitatorStore.avaliableAllocatedTokens || '0'
                    )
                  }}
                </span>
                <span v-if="!isConnected" class="text-4xl font-bold"> -- </span>
                <Ticker />
              </div>
            </div>
          </div>
        </Card>
      </DashboardMobileSection>
    </div>
  </div>

  <DashboardMobileSection title="my-relays">
    <Card title="Relays" :icon="'eos-icons:product-classes-outlined'">
      <DataTableMyRelays />
    </Card>
  </DashboardMobileSection>
</template>

<style scoped lang="scss">
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
