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
    class="shadow-xl dark:ring-4 ring-4 dark:ring-teal-600/10 ring-slate-200/70 p-px rounded-3xl w-full relative group transition-all duration-700 lg:opacity-100 h-full"
  >
    <div
      :class="[isVisible ? 'opacity-100' : 'opacity-0']"
      class="bg-gradient-to-br dark:from-cyan-300 dark:to-cyan-500 from-zinc-200 to-gray-300 blur w-full h-full absolute inset-0 rounded-3xl lg:opacity-0 lg:group-hover:opacity-100 dark:ring-cyan-400 shadow-2xl ring-1 dark:shadow-teal-900 shadow-gray-800 transition-all duration-700"
    ></div>

    <!-- Inner -->
    <div
      :class="[
        isVisible
          ? 'dark:bg-gray-900 bg-slate-200'
          : 'dark:bg-gray-900/60 bg-slate-200/60',
      ]"
      class="dark:group-hover:bg-gray-900 group-hover:bg-slate-100 relative flex flex-col h-full rounded-3xl dark:lg:bg-gray-900/60 bg-gradient-to-br from-slate-100/50 to-gray-300/50 dark:bg-none overflow-hidden"
    >
      <h2
        v-if="title"
        class="dark:text-cyan-200 lg:text-3xl text-2xl tracking-wide flex items-center gap-2 py-4 px-4 relative z-10 font-brand"
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
        class="absolute h-12 dark:bg-gray-900 bg-slate-100 w-full bottom-0 [mask-image:linear-gradient(to_top,black_20%,transparent)] block lg:hidden"
      ></div>
    </div>
  </div>
</template>
