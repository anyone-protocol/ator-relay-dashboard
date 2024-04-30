<script setup lang="ts">
import { storeToRefs } from 'pinia';

const userStore = useUserStore();
const { address } = storeToRefs(userStore);

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
</script>


<template>
  <!-- <NotConnected /> -->

  <div class="relative grid grid-flow-row grid-cols-1 gap-6 lg:grid-cols-6">
    <section
      class="flex h-[calc(100svh-62px)] snap-center snap-always flex-col justify-between self-center lg:col-span-4 lg:h-full lg:flex-row">
      <CardHero>
        <div class="px-5 py-6">
          <div class="flex w-full justify-between">
            <div>
              <h2 class="text-3xl tracking-wide">Welcome back</h2>
              <Address v-if="userStore.address" :address="userStore.address" />
            </div>

            <ChainSelector />
          </div>

          <div class="mt-6 flex flex-col gap-2">
            <UserClaimableRewards
              class="bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-6xl font-bold text-transparent drop-shadow-lg dark:bg-gradient-to-r dark:from-gray-200 dark:to-gray-600" />

            <p v-if="claimableError">
              <Icon name="iwwa:alert" class="h-4 w-4 text-red-500" />
              <span class="text-red-500 ml-1 text-xs">Error retrieving rewards</span>
            </p>
            <p v-else class="ml-1 text-xs">
              Pending rewards in
              <Ticker />
            </p>

            <ButtonAlt :icon-name="'heroicons:sparkles'" :disabled="!userStore.hasClaimableRewards"
              @click="userStore.claimAllRewards">
              <span v-if="userStore.claimableRewards <= 0">Nothing to claim</span>
              <span v-else>Claim rewards now</span>
            </ButtonAlt>
          </div>


        </div>

        <!-- <DataVisualRewards class="-mt-16 hidden lg:block" /> -->
      </CardHero>

      <!-- <DataVisualRewards class="block lg:hidden" /> -->
    </section>

    <div class="flex w-full flex-col gap-4 lg:col-span-2 lg:flex-col-reverse">
      <DashboardMobileSection title="account-balance">
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

      <DashboardMobileSection title="my-rewards">
        <Card title="Rewards history" :icon="'eos-icons:trusted-organization'">
          <p class="mb-4 text-sm">
            Earn rewards by contributing relays to the ATOR network.
          </p>
          <div class="my-4 flex flex-col border-l-4 border-cyan-600 pl-3">
            <h3>Claimed rewards</h3>
            <div class="inline-flex items-baseline gap-2">
              <span class="text-4xl font-bold"> {{ userStore.claimedRewardsTotal }} </span>
              <Ticker />
            </div>
          </div>

          <div class="my-4 flex flex-col border-l-4 border-cyan-600 pl-3">
            <h3>Claimable rewards</h3>
            <div class="inline-flex items-baseline gap-2">
              <span class="text-4xl font-bold">
                {{ userStore.claimableRewards }}
              </span>
              <Ticker />
            </div>
          </div>

          <div class="mt-4 p-1 text-xs text-gray-500">
            <!-- Last Updated: {{ lastClaimedTimestamp ?? new Date().toUTCString() }} -->
          </div>

          <div class="my-4 h-px w-full bg-gradient-to-r from-gray-600/10 via-cyan-900 to-gray-600/10"></div>
          <ButtonAttention :disabled="!userStore.hasClaimableRewards" @click="userStore.claimAllRewards">
            <span v-if="!userStore.hasClaimableRewards">Nothing to claim</span>
            <span v-else>Claim rewards now (
              <UserClaimableRewards />)
            </span>
          </ButtonAttention>
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
