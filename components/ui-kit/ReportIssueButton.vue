<template>
  <UButton
    color="gray"
    variant="soft"
    @click="onReportIssueClicked"
    class="ring-1 ring-inset ring-neutral-200 dark:ring-neutral-700 bg-neutral-100 dark:bg-neutral-800/50 hover:dark:bg-neutral-800/25"
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
