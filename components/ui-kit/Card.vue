<script lang="ts" setup>
import { vIntersectionObserver } from '@vueuse/components';

defineProps<{
  title?: string;
  icon?: string;
  noPadding?: boolean;
}>();

const isVisible = ref(false);

const onInView = ([{ isIntersecting }]: [{ isIntersecting: boolean }]) => {
  isVisible.value = isIntersecting;
};
</script>

<template>
  <div
    v-intersection-observer="[onInView, { threshold: 0.75 }]"
    :class="[isVisible ? 'opacity-100' : 'opacity-70']"
    class="rounded-xl w-full relative group h-full border-2 border-gray-200 hover:border-cyan-500 dark:border-gray-800 dark:hover:border-cyan-500 lg:opacity-100"
  >
    <!-- Inner -->
    <div
      :class="[
        isVisible
          ? 'bg-white dark:bg-gray-900'
          : 'bg-white/90 dark:bg-gray-900/90',
      ]"
      class="relative flex flex-col h-full rounded-xl overflow-hidden"
    >
      <h2
        v-if="title"
        class="text-gray-800 group-hover:text-cyan-600 dark:text-gray-100 dark:group-hover:text-cyan-300 text-xl tracking-wide flex items-center gap-2 py-4 px-4 relative z-10 font-medium"
      >
        <Icon v-if="icon" :name="icon" />
        {{ title }}
      </h2>
      <!-- Padding -->
      <div
        :class="[noPadding ? 'p-0' : 'py-4 px-4 ']"
        class="flex-col flex h-full"
      >
        <slot></slot>
      </div>
      <div
        class="absolute h-12 bg-white dark:bg-gray-900 w-full bottom-0 [mask-image:linear-gradient(to_top,black_20%,transparent)] block lg:hidden"
      ></div>
    </div>
  </div>
</template>
