<script setup lang="ts">
const props = defineProps<{
  status?: 'hardware' | 'locked' | 'lock-required';
}>();
</script>

<template>
  <div v-if="status === 'lock-required'" class="text-orange-300">
    <Icon name="material-symbols:lock" />
    Lock Required
  </div>
  <div v-else-if="status === 'locked'" class="text-green-300">
    <Icon name="material-symbols:lock" />
    Locked
  </div>
  <div v-else-if="status === 'hardware'" class="text-athena-50">
    <Icon name="material-symbols:memory" />
    Hardware Relay
  </div>
  <div v-else class="text-athena-50">-</div>
</template>
