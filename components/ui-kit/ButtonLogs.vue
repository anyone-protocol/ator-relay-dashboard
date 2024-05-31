<script setup>
import { useEventlogStore } from '~/stores/eventlog';
import Logger from '~/utils/logger';

const logger = new Logger('EventLog.vue');
const logs = useEventlogStore();

const isOpen = ref(false);
const logsCopySuccess = ref(false);

const onCopyLogsToClipboardClicked = debounce(async () => {
  const type = 'text/plain';
  const logsJson = JSON.stringify(logs.logs);
  const logsBlob = new Blob([logsJson], { type });
  const item = new ClipboardItem({ [type]: logsBlob });

  try {
    await navigator.clipboard.write([item]);
    logsCopySuccess.value = true;
  } catch (error) {
    logger.error('Error copying logs to clipboard', error);
  }
});

const getTextColor = (type) => {
  switch (type.toLowerCase()) {
    case 'info':
      return 'text-green-300';
    case 'warn':
      return 'text-yellow-300';
    case 'error':
      return 'text-red-300';
    default:
      return 'text-primary';
  }
};
</script>

<template>
  <UTooltip text="View network logs">
    <UButton @click="isOpen = true" aria-label="View logs" variant="ghost">
      <Icon
        name="eos-icons:monitoring"
        class="text-xl text-cyan-600 dark:text-cyan-300"
      />
    </UButton>
  </UTooltip>

  <USlideover v-model="isOpen">
    <div class="px-6 py-3 h-full flex flex-col">
      <header class="mb-4 flex items-center justify-between">
        <h4 class="flex items-center gap-2 text-2xl">
          <Icon name="eos-icons:monitoring" />Network logs
        </h4>
        <UButton
          @click="isOpen = false"
          aria-label="Close logs"
          variant="ghost"
        >
          <Icon name="heroicons:x-mark" class="w-6 h-6 dark:text-white" />
        </UButton>
      </header>

      <div
        class="text-sm mb-6 flex items-center gap-4 rounded-3xl bg-teal-700/10 px-4 py-2 ring ring-cyan-800/60"
      >
        <span>Filter:</span>
        <UCheckbox name="info" label="Info" v-model="logs.filters.info" />
        <UCheckbox name="warn" label="Warn" v-model="logs.filters.warn" />
        <UCheckbox name="error" label="Error" v-model="logs.filters.error" />
      </div>

      <div class="relative overflow-auto h-full no-scrollbar mt-4">
        <div class="grid grid-cols-2">
          <div
            class="py-3.5 pr-3 text-left text-sm font-semibold lg:table-cell"
          >
            Time
          </div>
          <div class="py-3.5 text-left text-sm font-semibold lg:table-cell">
            Message
          </div>
        </div>
        <div class="max-w-full">
          <div
            class="grid grid-cols-2 dark:text-gray-400"
            v-for="log in logs.filtered.slice(0, 10)"
            :key="log.timestamp"
          >
            <div
              :class="getTextColor(log.level)"
              class="py-2 pr-3 text-sm lg:table-cell"
            >
              <code> {{ new Date(log.timestamp).toUTCString() }}</code>
            </div>
            <div
              :class="getTextColor(log.level)"
              class="py-2 text-sm lg:table-cell"
            >
              <code> {{ log.message }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </USlideover>
</template>
