<script setup lang="ts">
const props = defineProps<{
  address: `0x${string}`;
  truncated?: boolean;
}>();

const truncatedAddress = computed(
  () =>
    `${props.address.substring(0, 12)}...${props.address.substring(
      props.address.length - 4,
    )}`,
);
</script>

<template>
  <span class="text-sm">{{ truncatedAddress }}</span>
</template>
