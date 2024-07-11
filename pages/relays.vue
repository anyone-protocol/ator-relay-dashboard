<template>
  <DashboardMobileSection title="my-relays">
    <Card title="Relays" :icon="'eos-icons:product-classes-outlined'">
      <DataTableMyRelays />
    </Card>
  </DashboardMobileSection>
  <ReportIssueDialog />
  <SupportIssueDialog />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
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

const userStore = useUserStore();

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
</script>
