<template>
  <div
    class="relative grid grid-flow-row grid-cols-1 pt-4 lg:pt-0 gap-6 lg:grid-cols-6"
  >
    <div class="flex w-full flex-col gap-4 lg:col-span-6">
      <DashboardMobileSection title="account-balance">
        <Card title="Account balance" :icon="'eos-icons:master-outlined'">
          <div
            class="flex justify-between items-start lg:items-center flex-col lg:flex-row mb-2 lg:mb-0"
          >
            <p class="mb-4 text-sm">
              Current balance for the connected wallet:
            </p>
            <ReportIssueButton />
          </div>

          <div class="flex gap-5 lg:gap-32 flex-col lg:flex-row">
            <div class="border-l-4 border-cyan-600 pl-3 my-4">
              <UserBalance
                class="bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-6xl font-bold text-transparent drop-shadow-lg dark:from-gray-200 dark:to-gray-500"
                showTicker="true"
              />
            </div>
            <div class="flex flex-col border-l-4 border-cyan-600 pl-3 my-4">
              <div class="inline-flex items-baseline gap-2">
                <span v-if="isConnected" class="text-4xl font-bold">
                  {{ formatEther(registratorStore.totalLockedTokens || '0') }}
                </span>
                <span v-if="!isConnected" class="text-4xl font-bold"> -- </span>
                <Ticker />
              </div>
              <h3>
                <Icon name="material-symbols:lock" />
                Locked
              </h3>
            </div>
          </div>
        </Card>
      </DashboardMobileSection>

      <DashboardMobileSection title="my-rewards">
        <Card>
          <div
            class="flex justify-between items-start lg:items-center flex-col lg:flex-row mb-2 lg:mb-0"
          >
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
              <div class="divider hidden lg:visible"></div>
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
  <ReportIssueDialog />
  <SupportIssueDialog />
</template>

<script setup lang="ts">
import { useAccount } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import { useFacilitatorStore } from '@/stores/useFacilitatorStore';
import { useUserStore } from '@/stores/useUserStore';
import { useRegistratorStore } from '@/stores/useRegistratorStore';
import { formatEther } from 'ethers';
import DashboardMobileSection from '@/components/DashboardMobileSection.vue';
import UserBalance from '@/components/UserBalance.vue';
import Button from '@/components/ui-kit/Button.vue';
import Card from '@/components/ui-kit/Card.vue';
import Ticker from '@/components/ui-kit/Ticker.vue';
import ReportIssueButton from '@/components/ui-kit/ReportIssueButton.vue';
import ReportIssueDialog from '@/components/ui-kit/ReportIssueDialog.vue';
import { initRegistrator, useRegistrator } from '@/composables/registrator';
import { useFacilitator } from '@/composables/facilitator';
import { initDistribution, useDistribution } from '@/composables/distribution';
import { initRelayRegistry } from '@/composables/relay-registry';
import { initFacilitator } from '@/composables/facilitator';
import { initToken } from '@/composables/token';

const userStore = useUserStore();
const facilitatorStore = useFacilitatorStore();
const registratorStore = useRegistratorStore();
const { isConnected } = useAccount({ config });

const isRedeemLoading = ref(false);
const progressLoading = ref(0);

const toast = useToast();

onMounted(async () => {
  await userStore.getTokenBalance();

  facilitatorStore.pendingClaim = getRedeemProcessSessionStorage(
    userStore.userData.address
  );

  initRelayRegistry();
  initFacilitator();
  initRegistrator();
  initToken();
  initDistribution();
});

watch(
  () => userStore.userData.address,
  async (newAddress?: string) => {
    facilitatorStore.pendingClaim = getRedeemProcessSessionStorage(newAddress);
    await userStore.getTokenBalance();
    await userStore.getSerialsRelays();
    await userStore.getNickNames();

    const facilitator = useFacilitator();
    await facilitator?.refresh();

    const registrator = useRegistrator();
    await registrator?.refresh();

    await useDistribution().claimable(newAddress as string);
    await useDistribution().refresh();
  }
);

watch(
  () => facilitatorStore.pendingClaim,
  (updatedPendingClaim) => {
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
      description: `Error redeem rewards: ${error}`,
    });
  }

  isRedeemLoading.value = false;
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
