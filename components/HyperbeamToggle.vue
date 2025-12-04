<script setup lang="ts">
import { useAccount } from '@wagmi/vue';
import { useHyperbeamFlag } from '~/composables/useHyperbeamFlag';

const { isConnected } = useAccount();
const { hyperbeamEnabled, setEnabled } = useHyperbeamFlag();
const runtimeConfig = useRuntimeConfig();

const shouldShowToggle = computed(() => {
  if (!isConnected.value) return false;

  const appEnv = runtimeConfig.public.appEnv;
  if (appEnv === 'live') return false;

  const hostname = window.location.hostname;
  return (
    hostname.startsWith('localhost') || hostname === 'dashboard-stage.anyone.io'
  );
});

const toggleHyperbeam = (value: boolean) => {
  console.log('[HyperbeamToggle] Toggle clicked, new value:', value);
  setEnabled(value);
};
</script>

<template>
  <div
    v-if="shouldShowToggle"
    class="flex items-center gap-3 py-1 px-2 border border-dashed border-cyan-500 dark:border-cyan-500"
  >
    <p class="text-sm">Hyperbeam</p>
    <UToggle
      :model-value="hyperbeamEnabled"
      @update:model-value="toggleHyperbeam"
    />
  </div>
</template>
