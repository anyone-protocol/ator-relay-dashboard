<script setup lang="ts">
import { type RelayRow } from '@/types/relay';

const emit = defineEmits<{
  (e: 'relayAction', type: FunctionName, fingerprint: string): void;
}>();

const props = defineProps<{
  row: RelayRow;
}>();
</script>

<template>
  <div class="max-w-32">
    <UButton
      v-if="props.row.status === 'verified'"
      icon="i-heroicons-check-circle-solid"
      size="xl"
      color="green"
      variant="outline"
      label="Claimed"
      :disabled="true"
      :trailing="false"
      block
    />

    <UButton
      v-if="props.row.status === 'claimable'"
      size="xl"
      color="green"
      variant="solid"
      label="Claim Now"
      @click="emit('relayAction', 'claim', props.row.fingerprint)"
      :trailing="false"
      block
    />
  </div>
</template>
