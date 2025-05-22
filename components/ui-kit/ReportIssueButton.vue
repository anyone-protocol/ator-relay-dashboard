<template>
  <UButton color="gray" variant="outline" @click="onReportIssueClicked">
    <UIcon name="i-heroicons-exclamation-circle" />
    <div>
      <span>Report Issue</span>
    </div>
  </UButton>
</template>

<script setup lang="ts">
import { useEventlogStore } from '~/stores/eventlog';

const eventlog = useEventlogStore();

const onReportIssueClicked = debounce(() => {
  eventlog.isReportIssueOpen = true;
});
</script>
