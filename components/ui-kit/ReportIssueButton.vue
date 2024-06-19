<template>
  <UButton
    variant="outline"
    @click="onReportIssueClicked"
    class=" flex p-2 gap-3 items-center text-left cursor-pointer hover:bg-slate-100 hover:text-white dark:hover:bg-cyan-600 dark:hover:text-white"
  >
  <UIcon
      name="i-heroicons-exclamation-circle"
    />
    <div class="flex flex-col flex-wrap gap-1">
      <span class="dark:text-white text-xs uppercase text-black">Report Issue</span>
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
