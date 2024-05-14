<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { initRelayRegistry } from '~/composables/relay-registry';
import { useAccount } from "use-wagmi";
import { config } from "@/config/wagmi.config"

const userStore = useUserStore();
const { address } = storeToRefs(userStore);
const { isConnected } = useAccount({config});

// Initialize data fetch and cache
// Retrieve the user data and set state
// These auto refresh when the address changes
const { refresh: claimedRefresh, error: claimedError } = await useAsyncData(
  "claimed", () => userStore.getClaimedRewardsTotal().then(() => true), { watch: [address] }
);
const { refresh: claimableRefresh, error: claimableError } = await useAsyncData(
  "claimable", () => userStore.getClaimableRewards().then(() => true), { watch: [address] }
);

// Get new data every 5 minutes
onMounted(() => {
  setInterval(() => {
    claimedRefresh();
    claimableRefresh();
  }, 1000 * 60 * 5);
})

initRelayRegistry();
</script>


<template>
  <div class="relative grid grid-flow-row grid-cols-1 pt-4 lg:pt-0 gap-6 lg:grid-cols-6">
    <div class="flex w-full flex-col gap-4 lg:flex-row lg:col-span-6 lg:flex-row-reverse">
      <DashboardMobileSection class="lg:basis-1/2" title="account-balance">
        <Card title="Account balance" :icon="'eos-icons:master-outlined'">
          <p class="mb-4 text-sm">
            The connected wallet shows the following balance:
          </p>

          <div class="flex flex-col">
            <UserBalance
              class="bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-6xl font-bold text-transparent drop-shadow-lg dark:from-gray-200 dark:to-gray-500">
              <p class="ml-1 mt-2 text-sm">
                <Ticker /> Account balance
              </p>

            </UserBalance>
          </div>
        </Card>
      </DashboardMobileSection>

      <DashboardMobileSection class="lg:basis-1/2" title="my-rewards">
        <Card title="Rewards history" :icon="'eos-icons:trusted-organization'">
          <p class="mb-4 text-sm">
            Earn rewards by contributing relays to the ATOR network.
          </p>
          <div class="my-4 flex flex-col border-l-4 border-cyan-600 pl-3">
            <h3>Claimed rewards</h3>
            <div class="inline-flex items-baseline gap-2">
              <span v-if="isConnected" class="text-4xl font-bold"> {{ userStore.claimedRewardsTotal }} </span>
              <span v-if="!isConnected" class="text-4xl font-bold"> -- </span>
              <Ticker />
            </div>
          </div>

          <div class="my-4 flex flex-col border-l-4 border-cyan-600 pl-3">
            <h3>Claimable rewards</h3>
            <div class="inline-flex items-baseline gap-2">
              <span v-if="isConnected" class="text-4xl font-bold"> {{ userStore.claimableRewards }} </span>
              <span v-if="!isConnected" class="text-4xl font-bold"> -- </span>
              <Ticker />
            </div>
          </div>

          <!-- <div class="mt-4 p-1 text-xs text-gray-500">
            Last Updated: {{ lastClaimedTimestamp ?? new Date().toUTCString() }}
          </div>

          <div class="my-4 h-px w-full bg-gradient-to-r from-gray-600/10 via-cyan-900 to-gray-600/10"></div>
          <ButtonAttention :disabled="!userStore.hasClaimableRewards" @click="userStore.claimAllRewards">
            <span v-if="!userStore.hasClaimableRewards">Nothing to redeem</span>
            <span v-else>Redeem rewards now (
              <UserClaimableRewards />)
            </span>
          </ButtonAttention> -->
        </Card>
      </DashboardMobileSection>
    </div>
  </div>

  <DashboardMobileSection title="my-relays">
    <Card title="My Relays" :icon="'eos-icons:product-classes-outlined'">
      <DataTableMyRelays />
    </Card>
  </DashboardMobileSection>
</template>
