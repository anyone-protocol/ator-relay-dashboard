<script setup lang="ts">
import { type RelayRow } from '@/types/relay';

const emit = defineEmits<{
  (e: 'relayAction', type: FunctionName, fingerprint: string): void;
}>();

const props = defineProps<{
  row: RelayRow;
  isLocked: boolean;
}>();
</script>

<template>
  <div class="max-w-32">
    <UButton
      v-if="!props.isLocked && props.row.status !== 'verified'"
      size="xl"
      color="orange"
      variant="outline"
      label="Claimed"
      class="flex-col text-xs"
      block
    >
      <div class="text-sm font-medium">Lock</div>
      <div>Lock 100 $ATOR</div>
    </UButton>

    <UButton
      v-else-if="props.row.status === 'verified' || props.isLocked"
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
      v-else-if="props.row.status === 'claimable' && props.isLocked"
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
