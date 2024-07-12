<template>
  <DashboardMobileSection title="my-relays">
    <Card  class="mt-[1rem]">
      <div class="flex items-center mb-[1rem] justify-between">
        <div class="flex items-center space-x-2">
          <Icon name="eos-icons:product-classes-outlined" class="w-[1.8rem] h-[1.8rem]" />
          <p class="text-[2rem]">Relays</p>
        </div>
        <div class="flex justify-center">
          <UButton
            @click="registerModalOpen = true"
            color="green"
            variant="outline"
            label="Register Relay"
          />
        </div>
      </div>
      <DataTableMyRelays :currentTab="currentTab" @update:currentTab="handleTabChange" />
    </Card>
  </DashboardMobileSection>
  <ReportIssueDialog />
  <SupportIssueDialog />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/useUserStore';
import DashboardMobileSection from '@/components/DashboardMobileSection.vue';
import DataTableMyRelays from '@/components/DataTableMyRelays/DataTableMyRelays.vue';
import Card from '@/components/ui-kit/Card.vue';
import ReportIssueDialog from '@/components/ui-kit/ReportIssueDialog.vue';
import { initRegistrator, useRegistrator } from '@/composables/registrator';
import { initDistribution, useDistribution } from '@/composables/distribution';
import { initRelayRegistry } from '@/composables/relay-registry';
import { initFacilitator } from '@/composables/facilitator';
import { initToken } from '@/composables/token';
import { type RelayRow, type RelayTabType } from '@/types/relay';

const userStore = useUserStore();
const registerModalOpen = ref(false);
const currentTab = ref<RelayTabType>('all');

onMounted(async () => {
  initDistribution();
  initRelayRegistry();
  initFacilitator();
  initRegistrator();
  initToken();

  await userStore.getVerifiedRelays();
  await userStore.getClaimableRelays();
});

watch(
  () => userStore.userData.address,
  async (newAddress?: string) => {
    await useDistribution().claimable(newAddress as string);
    await useDistribution().refresh();
  }
);

const handleTabChange = (key: RelayTabType) => {
  currentTab.value = key;
};
</script>