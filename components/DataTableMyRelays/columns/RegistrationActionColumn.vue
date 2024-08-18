<script setup lang="ts">
import { type RelayRow } from '@/types/relay';

const emit = defineEmits<{
  (e: 'relayAction', type: FunctionName, fingerprint: string): void;
  (e: 'onLockRelay', fingerprint: string): void;
}>();

const props = defineProps<{
  row: RelayRow | undefined;
  isLocked: boolean;
  isLoading?: boolean;
  hasRegistrationCredit: boolean | undefined;
  registrationCreditsRequired: boolean;
  familyVerified: boolean | undefined;
  familyRequired: boolean;
}>();
</script>

<template>
  <template v-if="isLoading">
    <USkeleton class="w-[15rem] h-10" />
  </template>
  <template v-else>
    <div class="max-w-32" v-if="props.row">
      <UButton
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
        <div>100 $ANYONE</div>
      </UButton>
      <UButton
        v-else-if="
          props.row.status === 'claimable' &&
          props.isLocked &&
          props.hasRegistrationCredit &&
          props.familyVerified
        "
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
        v-else-if="
          props.row.status === 'claimable' &&
          props.isLocked &&
          !props.hasRegistrationCredit &&
          props.registrationCreditsRequired
        "
        size="xl"
        color="green"
        variant="outline"
        label="No Credit"
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
        size="xl"
        color="green"
        variant="outline"
        label="Family Not Verified"
        class="flex-col text-xs"
        :trailing="false"
        :disabled="true"
        block
      >
        <div class="text-sm font-medium">Family</div>
        <div>Not Verified</div>
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
    </div>
  </template>
</template>
