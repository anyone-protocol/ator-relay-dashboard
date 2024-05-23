<script setup lang="ts">
defineProps<{
  iconName?: string;
}>();
</script>

<template>
  <button
    class="mt-2 flex gap-1 items-center px-2 py-1 rounded-2xl bg-teal-700/20 ring-2 ring-cyan-400/40 text-xs w-fit shadow"
  >
    <Icon v-if="iconName" :name="iconName" />
    <slot></slot>
  </button>
</template>
