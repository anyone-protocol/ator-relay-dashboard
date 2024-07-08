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

const userStore = useUserStore();

onMounted(async () => {
  await userStore.getVerifiedRelays();
  await userStore.getClaimableRelays();
});
</script>
