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
    <USkeleton class="w-[15rem] h-10" />
  </template>
  <template v-else>
    <div v-if="isLocked" class="text-green-600 dark:text-green-300">
      <Icon name="material-symbols:lock" />
      Locked
    </div>
    <div v-else-if="isHardware" class="text-athena-50">
      <Icon name="material-symbols:memory" />
      Hardware Relay
    </div>
    <div v-else-if="isVerified" class="text-athena-50">-</div>
    <div v-else class="text-orange-600 dark:text-orange-500">
      <Icon name="material-symbols:lock" />
      Lock Required
    </div>
  </template>
</template>
