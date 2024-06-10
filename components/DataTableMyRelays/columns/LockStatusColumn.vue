<script setup lang="ts">
defineProps<{
  isLocked?: boolean;
  isHardware?: boolean;
  isVerified?: boolean;
}>();
</script>

<template>
  <div v-if="isLocked" class="text-green-300">
    <Icon name="material-symbols:lock" />
    Locked
  </div>
  <div v-else-if="isHardware" class="text-athena-50">
    <Icon name="material-symbols:memory" />
    Hardware Relay
  </div>
  <div v-else-if="isVerified" class="text-athena-50">-</div>
  <div v-else class="text-orange-300">
    <Icon name="material-symbols:lock" />
    Lock Required
  </div>
</template>
