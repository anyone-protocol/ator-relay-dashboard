<script setup lang="ts">
/**
 * Purpose: On mobile devices this creates a section that when scrolled into view
 * it updates the URL
 */

import kebabCase from 'lodash.kebabCase';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { vIntersectionObserver } from '@vueuse/components';

const props = defineProps<{
  title: string;
}>();

const menuStore = useMenuStore();
const breakpoints = useBreakpoints(breakpointsTailwind);
const smallerThanLg = breakpoints.smaller('lg');

const onInView = ([{ isIntersecting }]: [{ isIntersecting: boolean }]) => {
  // Only fire on smaller screens when in view
  if (smallerThanLg.value && isIntersecting) {
    // Update the Pinia state store
    menuStore.inViewSection = kebabCase(props.title);
  }
};
</script>

<template>
  <section
    v-intersection-observer="[onInView, { threshold: 0.75 }]"
    :data-title="title"
    :id="title"
    class="h-auto snap-always snap-center"
  >
    <slot></slot>
  </section>
</template>
