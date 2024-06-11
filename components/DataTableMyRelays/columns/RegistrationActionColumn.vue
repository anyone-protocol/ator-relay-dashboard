<script setup lang="ts">
import { type RelayRow } from '@/types/relay';

const emit = defineEmits<{
  (e: 'relayAction', type: FunctionName, fingerprint: string): void;
  (e: 'onLockRelay', fingerprint: string): void;
}>();

const props = defineProps<{
  row: RelayRow | undefined;
  isLocked: boolean;
}>();
</script>

<template>
  <div class="max-w-32" v-if="props.row">
    <!-- <UButton
      v-if="!props.isLocked"
      size="xl"
      color="orange"
      variant="outline"
      label="Claimed"
      class="flex-col text-xs"
      @click="emit('onLockRelay', props.row.fingerprint)"
      :disabled="row?.isWorking"
      block
    >
      <div class="text-sm font-medium">Lock</div>
      <div>Lock 100 $ATOR</div>
    </UButton> -->
    <UButton
      v-if="props.row.status === 'claimable'"
      size="xl"
      color="green"
      variant="solid"
      label="Claim Now"
      @click="emit('relayAction', 'claim', props.row.fingerprint)"
      :trailing="false"
      :disabled="row?.isWorking"
      block
    />
    <UButton
      v-else-if="props.row.status === 'verified'"
      icon="i-heroicons-check-circle-solid"
      size="xl"
      color="green"
      variant="outline"
      label="Claimed"
      :disabled="true"
      :trailing="false"
      block
    />
  </div>
</template>
