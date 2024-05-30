<script setup lang="ts">
const props = defineProps<{
  placement: 'top' | 'bottom' | 'left' | 'right';
  arrow: boolean;
  mode?: 'hover' | 'click';
}>();
</script>

<template>
  <UPopover
    :popper="{
      placement: props.placement ?? 'top',
      arrow: props.arrow ?? true,
      offsetDistance: 4,
    }"
    :mode="props.mode ?? 'hover'"
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
    <template #panel>
      <div class="p-2 max-w-64">
        <slot name="content"></slot>
      </div>
    </template>
    <slot name="trigger"></slot>
  </UPopover>
</template>
