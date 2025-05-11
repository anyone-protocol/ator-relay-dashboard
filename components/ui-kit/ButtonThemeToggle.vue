<script setup>
const menuStore = useMenuStore();
const colorMode = useColorMode();

const changeMode = () => {
  menuStore.$patch({
    colorMode: colorMode.value === 'light' ? 'dark' : 'light',
  });
  return (colorMode.preference =
    colorMode.value === 'light' ? 'dark' : 'light');
};
</script>

<template>
  <ClientOnly>
    <UTooltip text="Toggle colour mode">
      <UButton
        @click="changeMode"
        aria-label="Color Mode"
        variant="ghost"
        class="hover:bg-neutral-100 dark:hover:bg-neutral-800 p-[8px]"
      >
        <ColorScheme placeholder="...">
          <Icon
            v-if="colorMode.value === 'dark'"
            name="heroicons-outline:moon"
            class="text-xl dark:text-neutral-50 text-neutral-600"
          />
          <Icon
            v-else
            name="heroicons-outline:sun"
            class="text-xl dark:text-neutral-300 text-neutral-600"
          />
        </ColorScheme>
      </UButton>
    </UTooltip>
  </ClientOnly>
</template>
