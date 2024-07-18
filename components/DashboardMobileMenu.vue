<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import ButtonConnect from './ui-kit/ButtonConnect.vue';
import GlowEffect from './ui-kit/GlowEffect.vue';
import ButtonThemeToggle from './ui-kit/ButtonThemeToggle.vue';
import ReportIssueButton from './ui-kit/ReportIssueButton.vue';

const breakpoints = useBreakpoints(breakpointsTailwind);
const lgAndLarger = breakpoints.greaterOrEqual('lg');

const router = useRouter();
const menuStore = useMenuStore();

// Close the mobile nav when navigating
router.beforeEach(async () => {
  menuStore.$patch({ isOpen: false });
});
</script>

<template>
  <div
    v-if="!lgAndLarger && menuStore.isOpen"
    class="fixed inset-0 w-full h-full dark:bg-gray-900/90 from-teal-50 to-slate-200 bg-gradient-to-br backdrop-blur dark:bg-none overflow-hidden z-10"
  >
    <GlowEffect />

    <div class="px-8 pb-12 pt-24 flex flex-col h-full">
      <div class="flex justify-between py-6 gap-4">
        <ButtonConnect />
        <ButtonThemeToggle />
      </div>
      <div class="mb-4 flex-col flex space-y-2">
        <RouterLink to="/">
          <UButton variant="outline" class="nav-button uniform-height text-sm lg:text-base w-[8rem]"
            >Home</UButton
          >
        </RouterLink>
        <RouterLink to="/relays">
          <UButton variant="outline" class="nav-button uniform-height text-sm lg:text-base w-[8rem]"
            >Relays</UButton
          >
        </RouterLink>
        <ReportIssueButton class="w-[8rem]"/>
      </div>
      <div
        class="w-full bg-gradient-to-r from-gray-600/10 via-cyan-600 to-gray-600/10 h-px"
      ></div>

      <div
        class="flex justify-center items-center dark:text-cyan-300 gap-4 mt-auto"
      >
        <a href="#">
          <Icon name="simple-icons:discord" class="h-5 w-auto"></Icon>
        </a>
        <a href="#">
          <Icon name="simple-icons:x" class="h-5 w-auto"></Icon>
        </a>
        <a href="#">
          <Icon name="simple-icons:telegram" class="h-5 w-auto"></Icon>
        </a>
        <a href="#">
          <Icon name="simple-icons:youtube" class="h-5 w-auto"></Icon>
        </a>
      </div>
    </div>
  </div>
</template>
