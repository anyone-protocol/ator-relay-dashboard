<!-- FingerprintDisplay.vue -->
<template>
  <div @click="copyToClipboard" class="cursor-pointer relative">
    <UTooltip :text="fullFingerprint" class="mr-[5px]">
      <span>{{ formattedFingerprint }}</span>
    </UTooltip>
    <span
      v-if="copied"
      class="absolute right-[-10px] top-0 text-green-500 ml-2"
    >
      <Icon name="i-heroicons-check-circle" />
    </span>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

const props = defineProps<{
  fingerprint: string;
}>();

const fullFingerprint = ref(props.fingerprint);
const copied = ref(false);

const formattedFingerprint = computed(() => {
  return (
    fullFingerprint.value.slice(0, 5) + '...' + fullFingerprint.value.slice(-4)
  );
});

const copyToClipboard = () => {
  navigator.clipboard
    .writeText(fullFingerprint.value)
    .then(() => {
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    })
    .catch(() => {
      console.error('Failed to copy to clipboard');
    });
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
