<script setup lang="ts">
defineProps<{
  isLocked?: boolean;
  isHardware?: boolean;
  isVerified?: boolean;
  isLoading?: boolean;
}>();
</script>
<template>
  <template v-if="isLoading">
    <USkeleton class="w-[6rem] h-8" />
  </template>
  <template v-else>
    <!-- Both locked and hardware verified -->
    <div
      v-if="isLocked && isHardware"
      class="text-athena-600 dark:text-athena-50"
    >
      <Icon name="material-symbols:memory" />
      Hardware
    </div>
    <!-- Locked relay (takes precedence over hardware-only) -->
    <div v-else-if="isLocked" class="text-green-600 dark:text-green-300">
      <Icon name="material-symbols:lock" />
      Locked
    </div>
    <!-- Hardware verified but not locked -->
    <div v-else-if="isHardware" class="text-athena-600 dark:text-athena-50">
      <Icon name="material-symbols:memory" />
      Hardware
    </div>
    <!-- Verified relay with no lock/hardware status -->
    <div v-else-if="isVerified" class="text-athena-600 dark:text-athena-50">
      -
    </div>
    <!-- No lock, no verification - action required -->
    <div v-else class="text-orange-600 dark:text-orange-500">
      <Icon name="material-symbols:lock" />
      Lock Required
    </div>
  </template>
</template>
