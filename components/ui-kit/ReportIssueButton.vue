<template>
  <UButton
    class="h-3rem ring-gray-200 text-gray-950 hover:bg-gray-100/50 dark:ring-gray-700 dark:text-gray-50 dark:hover:bg-gray-800/50"
    variant="outline"
    @click="onReportIssueClicked"
  >
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
