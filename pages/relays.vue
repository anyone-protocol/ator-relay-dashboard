<template>
  <DashboardMobileSection title="my-relays">
    <Card class="mt-[1rem]">
      <div class="flex items-center mb-[1rem] justify-between">
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
        v-if="!isMobile"
        :currentTab="currentTab"
        @update:currentTab="handleTabChange"
        :registerModalOpen="registerModalOpen"
      />
      <DataTableMyRelaysMobile
        v-else
        :currentTab="currentTab"
        @update:currentTab="handleTabChange"
        :registerModalOpen="registerModalOpen"
      />
    </Card>
  </DashboardMobileSection>
  <UModal v-model="registerModalOpen">
    <UCard class="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h4
        class="text-lg font-semibold mb-4 border-b border-b-[rgba(255,255,255,0.1)] pb-4"
      >
        Register Fingerprint
      </h4>
      <UContainer>
        <p class="mb-[1rem] text-center">
          Note: This is for you to delegate a token lock for someone else.
        </p>
        <div class="mb-6">
          <UFormGroup label="ETH Wallet Address" class="mb-6">
            <UInput
              v-model="ethAddress"
              hint="The ETH Wallet Address associated with the fingerprint"
              placeholder="ETH Wallet Address"
              :rules="[rules.required]"
              :error="ethAddressError !== null"
              persistent-hint
              class="mb-1"
            />
          </UFormGroup>
          <UFormGroup label="Relay Fingerprint">
            <UInput
              v-model="fingerPrintRegister"
              hint="Fingerprint associated with the ETH Wallet Address"
              placeholder="Relay Fingerprint"
              :rules="[rules.required]"
              :error="fingerPrintRegisterError !== null"
              persistent-hint
              class="mb-1"
            />
          </UFormGroup>
        </div>
        <div class="flex justify-between">
          <UButton
            variant="outline"
            size="sm"
            color="red"
            @click="registerModalOpen = false"
          >
            Cancel
          </UButton>
          <UDivider />
          <UButton
            variant="outline"
            size="sm"
            color="primary"
            @click="handleLockRemote"
            :loading="lockRemoteLoading"
          >
            Register
          </UButton>
        </div>
      </UContainer>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/useUserStore';
import DashboardMobileSection from '@/components/DashboardMobileSection.vue';
import DataTableMyRelays from '@/components/DataTableMyRelays/DataTableMyRelays.vue';
import DataTableMyRelaysMobile from '@/components/DataTableMyRelays/DataTableMyRelaysMobile.vue';
import { initRegistrator, useRegistrator } from '@/composables/registrator';
import { initDistribution, useDistribution } from '@/composables/distribution';
import { initRelayRegistry } from '@/composables/relay-registry';
import { initFacilitator } from '@/composables/facilitator';
import { initToken } from '@/composables/token';
import { type RelayTabType } from '@/types/relay';
import Card from '~/components/ui-kit/Card.vue';
import { useMetricsStore } from '@/stores/useMetricsStore';
import { useMediaQuery } from '@vueuse/core';
import { lock } from 'ethers';

const isMobile = useMediaQuery('(max-width: 1024px)');

const userStore = useUserStore();
const registrator = useRegistrator();
const registerModalOpen = ref(false);
const currentTab = ref<RelayTabType>('all');
const metricsStore = useMetricsStore();
const isLoading = ref(true);

const initializeAndFetchData = async () => {
  try {
    // isLoading.value = true;
    initDistribution();
    initRelayRegistry();
    initFacilitator();
    initRegistrator();
    initToken();
    metricsStore.refreshRelayMetrics(),
      // await loadLockedRelays();
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
      registrator?.getLokedRelaysTokens(userStore.userData.address || '', true);
    } catch (error) {
      console.error('Error during address change handling:', error);
    }
  }
);

// const loadLockedRelays = async () => {
//   await registratorStore?.fetchLockedRelays(userStore.userData.address);
// };

onMounted(() => {
  console.log('Mounted - Starting initialization');
  initializeAndFetchData()
    .then(() => {
      console.log('Initialization complete');
    })
    .catch((error) => {
      console.error('Error in initialization:', error);
    });
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
    const register = useRegistrator();
    const success = await register?.lock(
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
