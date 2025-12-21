<script setup lang="ts">
import { type RelayRow } from '@/types/relay';

const emit = defineEmits<{
  (e: 'relayAction', type: FunctionName, fingerprint: string): void;
  (e: 'onLockRelay', fingerprint: string): void;
}>();

const props = defineProps<{
  row: RelayRow | undefined;
  isLocked: boolean | undefined;
  isLoading?: boolean;
  hasRegistrationCredit: boolean | undefined;
  registrationCreditsRequired: boolean;
  familyVerified: boolean | undefined;
  familyRequired: boolean | undefined;
  relayActionOngoing: boolean;
}>();
</script>

<template>
  <template v-if="isLoading">
    <USkeleton class="w-[15rem] h-10" />
  </template>
  <template v-else>
    <div class="max-w-34 min-w-[140px]" v-if="props.row">
      <UButton
        v-if="!props.isLocked"
        size="md"
        color="orange"
        variant="outline"
        label="Claimed"
        class="flex-col text-xs w-auto px-5"
        @click="emit('onLockRelay', props.row.fingerprint)"
        :disabled="props.relayActionOngoing"
        block
      >
        <div class="text-sm font-medium">Lock</div>
        <div>100 $ANYONE</div>
      </UButton>
      <UButton
        v-else-if="
          props.row.status === 'claimable' &&
          props.isLocked &&
          props.hasRegistrationCredit &&
          props.familyVerified
        "
        class="w-auto px-5"
        size="md"
        color="green"
        variant="solid"
        label="Claim Now"
        @click="emit('relayAction', 'claim', props.row.fingerprint)"
        :trailing="false"
        :disabled="props.relayActionOngoing"
        block
      />
      <UButton
        v-else-if="
          props.row.status === 'claimable' &&
          props.isLocked &&
          !props.hasRegistrationCredit &&
          props.registrationCreditsRequired
        "
        size="md"
        color="green"
        variant="outline"
        label="Waiting..."
        :trailing="false"
        :disabled="true"
        block
      />
      <UButton
        v-else-if="
          props.row.status === 'claimable' &&
          props.isLocked &&
          !props.familyVerified &&
          props.familyRequired
        "
        size="md"
        color="yellow"
        variant="outline"
        label="Loading"
        class="flex-col text-xs w-auto px-5"
        :trailing="false"
        :disabled="true"
        block
      >
        <div class="text-sm font-medium">Loading</div>
      </UButton>

      <UButton
        v-else-if="props.row.status === 'verified' || props.isLocked"
        icon="i-heroicons-check-circle-solid"
        class="w-auto px-5"
        size="md"
        color="green"
        variant="outline"
        label="Claimed"
        :disabled="true"
        :trailing="false"
        block
      />
    </div>
  </template>
</template>
