<script setup lang="ts">
const menuStore = useMenuStore();
const { toggle } = menuStore;
</script>

<template>
  <UButton @click="toggle" class="block lg:hidden" variant="ghost">
    <Icon
      v-if="!menuStore.isOpen"
      name="heroicons:bars-3"
      class="w-6 h-6 text-gray-900 dark:text-gray-100"
    />
    <Icon
      v-if="menuStore.isOpen"
      name="heroicons:x-mark"
      class="w-6 h-6 text-gray-900 dark:text-gray-100"
    />
  </UButton>
</template>
