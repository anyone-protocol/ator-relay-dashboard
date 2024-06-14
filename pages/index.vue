<script setup lang="ts">
import { initRelayRegistry } from '@/composables/relay-registry';
import { initFacilitator } from '@/composables/facilitator';
import { formatEther } from 'ethers';

import { useAccount } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import { useFacilitatorStore } from '@/stores/useFacilitatorStore';

import Card from '@/components/ui-kit/Card.vue';
import Ticker from '@/components/ui-kit/Ticker.vue';
import Button from '@/components/ui-kit/Button.vue';
import DataTableMyRelays from '@/components/DataTableMyRelays/DataTableMyRelays.vue';
import { useFacilitator } from '@/composables/facilitator';

import { getRedeemProcessSessionStorage } from '@/utils/redeemSessionStorage';
import { initRegistrator, useRegistrator } from '@/composables/registrator';
import { initToken } from '@/composables/token';
import { initDistribution, useDistribution } from '@/composables/distribution';
import { useRegistratorStore } from '@/stores/useRegistratorStore';
import type { ClaimProcess } from '@/types/facilitator';

const userStore = useUserStore();
const facilitatorStore = useFacilitatorStore();
const registratorStore = useRegistratorStore();
const { isConnected } = useAccount({ config });
const facilitator = useFacilitator();
const isRedeemLoading = ref(false);
const progressLoading = ref(0);

const toast = useToast();

// Get new data every 5 minutes
onMounted(async () => {
  facilitatorStore.pendingClaim = getRedeemProcessSessionStorage(
    userStore.userData.address
  );
  await userStore.getSerialsRelays();
});

initRelayRegistry();
initFacilitator();
initRegistrator();
initToken();
initDistribution();
// useMetricsStore().refresh();

watch(
  () => userStore.userData.address,
  async (newAddress?: string) => {
    facilitatorStore.pendingClaim = getRedeemProcessSessionStorage(newAddress);

    const facilitator = useFacilitator();
    await facilitator?.refresh();

    await userStore.getTokenBalance();
    await userStore.getSerialsRelays();

    const registrator = useRegistrator();
    await registrator?.refresh();

    await useDistribution().claimable(newAddress as string);
  }
);

watch(
  () => facilitatorStore.pendingClaim,
  (updatedPendingClaim: ClaimProcess | null) => {
    progressLoading.value = updatedPendingClaim ? 2 : 0;
  }
);

const handleClaimAllRewards = async () => {
  isRedeemLoading.value = true;
  progressLoading.value = 1;

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
  progressLoading.value = 0;
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

          <div class="flex gap-5 lg:gap-32 flex-col lg:flex-row">
            <div class="border-l-4 border-cyan-600 pl-3">
              <UserBalance
                class="bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-6xl font-bold text-transparent drop-shadow-lg dark:from-gray-200 dark:to-gray-500 "
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
                  {{ formatEther(registratorStore.totalLockedTokens || '0') }}
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
          <div class="flex justify-between items-start lg:items-center flex-col lg:flex-row mb-2 lg:mb-0">
            <div>
              <h2
                class="dark:text-cyan-200 lg:text-3xl text-2xl tracking-wide flex items-center  gap-2 font-brand"
              >
                <Icon name="eos-icons:trusted-organization" />
                Rewards history
              </h2>
              <p class="mb-4 text-sm mt-4">
                Earn rewards by contributing relays to the ATOR network.
              </p>
            </div>
            <div v-if="isConnected" class="redeem flex gap-6 items-center">
              <div class="divider  hidden lg:visible"></div>
              <div>
                <Button
                  :disabled="
                    !facilitatorStore.hasClaimableRewards ||
                    isRedeemLoading ||
                    !!facilitatorStore.pendingClaim
                  "
                  @onClick="handleClaimAllRewards"
                  class="mb-2"
                >
                  <span
                    v-if="isRedeemLoading || !!facilitatorStore.pendingClaim"
                    >Processing...</span
                  >
                  <span v-else-if="facilitatorStore.hasClaimableRewards"
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
