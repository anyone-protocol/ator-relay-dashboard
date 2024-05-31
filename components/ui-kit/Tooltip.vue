<script setup lang="ts">
const props = defineProps<{
  placement: 'top' | 'bottom' | 'left' | 'right';
  arrow: boolean;
  text: string;
}>();
</script>

<template>
  <UTooltip
    :popper="{
      placement: props.placement ?? 'top',
      arrow: props.arrow ?? true,
    }"
    :ui="{
      width: 'max-w-lg',
      base: 'border border-athena-200 dark:border-athena-700',
      background: 'bg-bristol-50 dark:bg-bristol-800',
      color: 'text-gray-900 dark:text-bristol-50',
      arrow: {
        background: 'before:bg-bristol-50 dark:before:bg-bristol-800',
      },
    }"
  >
    <template #text>
      {{ props.text }}
    </template>
    <slot></slot>
  </UTooltip>
</template>
