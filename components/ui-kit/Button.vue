<script setup lang="ts">
const emit = defineEmits<{
  (e: 'onClick'): void;
}>();

const props = defineProps<{
  disabled: boolean;
}>();
</script>

<template>
  <button
    :disabled="props.disabled"
    @click="emit('onClick')"
    class="h-12 w-1/1 border-2 border-cyan-500 dark:border-cyan-600 font-semibold text-gray-900 dark:text-white rounded-2xl p-2 px-8 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
  >
    <slot></slot>
  </button>
</template>
