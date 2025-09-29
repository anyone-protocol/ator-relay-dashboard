<template>
  <DashboardMobileSection title="my-relays">
    <Card class="overflow-auto min-h-0 h-full">
      <div class="flex items-center mb-6 justify-between">
        <div class="flex items-center space-x-2">
          <Icon
            name="eos-icons:product-classes-outlined"
            class="w-[1.8rem] h-[1.8rem]"
          />
          <p class="text-[2rem]">Relays</p>
        </div>
        <div class="flex justify-center">
          <UButton
            @click="registerModalOpen = true"
            color="green"
            variant="outline"
            label="Delegate Tokens"
          />
        </div>
      </div>
      <DataTableMyRelays
        :currentTab="currentTab"
        @update:currentTab="handleTabChange"
        :registerModalOpen="registerModalOpen"
      />
      <!-- <DataTableMyRelaysMobile
        v-else
        :currentTab="currentTab"
        @update:currentTab="handleTabChange"
        :registerModalOpen="registerModalOpen"
      /> -->
    </Card>
  </DashboardMobileSection>
  <UModal
    v-model="registerModalOpen"
    :ui="{
      overlay: {
        background: 'bg-neutral-200/50 dark:bg-neutral-800/50',
      },
    }"
  >
    <UCard
      class="bg-white dark:bg-neutral-900 rounded-lg shadow-lg relative ring-0"
    >
      <div class="flex gap-2 mb-4 pb-4">
        <Icon
          name="material-symbols:lock"
          color="#24adc3"
          class="h-6 w-auto"
        ></Icon>

        <h4 class="text-lg font-semibold">Register Fingerprint</h4>
      </div>

      <UContainer>
        <p class="mb-[1rem] text-center">
          Note: This is for you to delegate a token lock for someone else.
        </p>
        <div class="mb-6">
          <UFormGroup
            label="Operator's Relay Fingerprint"
            class="relative group"
          >
            <div
              class="relative group bg-transparent border-2 border-[#24adc3] rounded-md overflow-hidden focus-within:border-[#24adc3] transition-all duration-300"
            >
              <UInput
                v-model="fingerPrintRegister"
                placeholder="012382382142349FJSSDFJO31239"
                class="w-full text-neutral-900 dark:text-neutral-50 border-none"
                :rules="[rules.required]"
                :error="fingerPrintRegisterError !== null"
                persistent-hint
                input-class="text-sm md:text-md"
                color="neutral"
                size="xl"
              >
                <template #leading>
                  <Icon
                    name="mdi:fingerprint"
                    color="#24adc3"
                    class="h-6 w-6"
                  />
                </template>
              </UInput>
            </div>
          </UFormGroup>
          <UFormGroup label="Operator's ETH Wallet" class="mt-5">
            <div class="relative">
              <UInput
                v-model="ethAddress"
                placeholder="0x2abe87c45e0969a499bc003543ed9c661fa77049"
                class="border-2 rounded-md w-full text-neutral-900 dark:text-neutral-50 bg-transparent border-[#24adc3] text-sm"
                :rules="[rules.required]"
                :error="ethAddressError !== null"
                persistent-hint
                input-class="text-sm md:text-md"
                color="neutral"
                size="xl"
              >
                <template #leading>
                  <Icon
                    name="mdi:wallet"
                    color="#24adc3"
                    class="absolute top-1/2 transform -translate-y-1/2 left-4 h-6 w-6"
                  />
                </template>
              </UInput>
            </div>
          </UFormGroup>
        </div>
        <div class="flex justify-end gap-4">
          <UButton
            variant="outline"
            color="cyan"
            size="sm"
            @click="registerModalOpen = false"
            class="cancel-btn"
          >
            Cancel
          </UButton>
          <UButton
            variant="solid"
            size="sm"
            color="cyan"
            @click="handleLockRemote"
            :loading="lockRemoteLoading"
            class="lock-btn"
          >
            Lock Now
          </UButton>
          <!-- Ribbon Effect -->
          <!-- <div
            class="ribbon right-[-10px] md:right-[-5px] top-[90%] sm:top-[89%] w-[40px] h-[4px] sm:w-[60px] md:h-[6px]"
          ></div> -->
        </div>
      </UContainer>
    </UCard>
  </UModal>
</template>
<style scoped>
.ribbon {
  position: absolute;
  transform: translateY(-50%);
  background-color: #24adc3;
  border-radius: 50% 0 0 50%;
  animation: glow 1.5s infinite;
}

/* Glow animation */
@keyframes glow {
  0% {
    box-shadow: 0 0 10px #24adc3;
  }
  50% {
    box-shadow: 0 0 20px #24adc3;
  }
  100% {
    box-shadow: 0 0 10px #24adc3;
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/useUserStore';
import DashboardMobileSection from '@/components/DashboardMobileSection.vue';
import DataTableMyRelays from '@/components/DataTableMyRelays/DataTableMyRelays.vue';
// import DataTableMyRelaysMobile from '@/components/DataTableMyRelays/DataTableMyRelaysMobile.vue';
import { initFacilitator } from '@/composables/facilitator';
import { initToken } from '@/composables/token';
import { type RelayTabType } from '@/types/relay';
import Card from '~/components/ui-kit/Card.vue';
import { useMetricsStore } from '@/stores/useMetricsStore';
import { useMediaQuery } from '@vueuse/core';
import { useFacilitator } from '@/composables/facilitator';
import { initHodler, useHodler } from '~/composables/hodler';

const isMobile = useMediaQuery('(max-width: 1024px)');

const userStore = useUserStore();
// const facilitatorStore = useFacilitatorStore();
const hodlerStore = useHolderStore();
const hodler = useHodler();
const registerModalOpen = ref(false);
const currentTab = ref<RelayTabType>('all');
const metricsStore = useMetricsStore();
const isLoading = ref(true);

const initializeAndFetchData = async (
  newAddress: string | undefined,
  forceRefresh = false
) => {
  try {
    // isLoading.value = true;

    metricsStore.refreshRelayMetrics();
    await Promise.all([
      // (!facilitatorStore?.initialized || forceRefresh) &&
      //   useFacilitator()?.refresh(),
      (!hodlerStore?.initialized || forceRefresh) && useHodler()?.refresh(),
      ,
    ]);
    console.log('Data fetching complete');
  } catch (error) {
    console.error('Error during initialization:', error);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => userStore.userData.address,
  async (newAddress?: string) => {
    try {
      await Promise.all([hodler?.refresh(), userStore.createRelayCache()]);
    } catch (error) {
      console.error('Error during address change handling:', error);
    }
  }
);

watch(
  () => userStore.userData.address,
  async (newAddress?: string) => {
    await initializeAndFetchData(newAddress, true);
  }
);

onMounted(async () => {
  console.log('Mounted - Starting initialization');
  initializeAndFetchData(userStore.userData.address);
  await useRelayRewards().refresh();
  // initFacilitator();
  initToken();
  initHodler();
  await new Promise((resolve) => setTimeout(resolve, 2000));
});

// watch(
//   () => userStore.userData.address,
//   async (newAddress?: string) => {
//     try {
//       await useDistribution().refresh()
//     } catch (error) {
//       console.error('Error during address change handling:', error);
//     }
//   }
// );

const handleTabChange = (key: RelayTabType) => {
  currentTab.value = key;
};

// Modal logic
const ethAddress = ref('');
const ethAddressError = ref<string | null>(null);
const fingerPrintRegister = ref('');
const fingerPrintRegisterError = ref<string | null>(null);
const lockRemoteLoading = ref(false);

const rules = {
  required: (value: string) => !!value || 'Required',
};
const toast = useToast();

const handleLockRemote = async () => {
  lockRemoteLoading.value = true;
  if (fingerPrintRegisterError.value || ethAddressError.value) {
    lockRemoteLoading.value = false;
    toast.add({
      title: 'Error',
      description: 'Please fill in all fields',
      color: 'red',
    });
    return;
  }

  if (fingerPrintRegister.value == '' || ethAddress.value == '') {
    lockRemoteLoading.value = false;

    toast.add({
      title: 'Error',
      description: 'Please fill in all fields',
      color: 'red',
    });

    return;
  }

  try {
    const hodler = useHodler();
    const success = await hodler?.lock(
      fingerPrintRegister.value,
      ethAddress.value
    );
    if (success != null && typeof success != typeof Error) {
      registerModalOpen.value = false;
      toast.add({
        title: 'Success',
        description: 'Fingerprint registered successfully',
        color: 'green',
      });
      lockRemoteLoading.value = false;
    } else {
      // handle error
      toast.add({
        title: 'Error',
        description: 'Error registering fingerprint',
        color: 'red',
      });
      lockRemoteLoading.value = false;
    }
  } catch (error: any) {
    // handle error

    lockRemoteLoading.value = false;
  }
};
</script>
