<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import ButtonConnect from './ui-kit/ButtonConnect.vue';
import ButtonThemeToggle from './ui-kit/ButtonThemeToggle.vue';

const runtimeConfig = useRuntimeConfig();
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
    class="fixed inset-0 w-full h-full bg-neutral-50 dark:bg-neutral-900 backdrop-blur dark:bg-none overflow-hidden z-10"
  >
    <div class="px-8 pb-12 pt-24 flex flex-col h-full">
      <div class="flex justify-between py-6 gap-4">
        <ButtonConnect />
        <ButtonThemeToggle />
      </div>
      <div class="mb-4 flex-col flex space-y-2">
        <RouterLink to="/">
          <UButton
            variant="outline"
            class="nav-button uniform-height text-sm lg:text-base w-[8rem] ring-cyan-500 text-cyan-500 bg-cyan-100/50 hover:bg-cyan-100/50 dark:ring-cyan-400 dark:text-cyan-400 dark:bg-gray-800/50 dark:hover:bg-gray-800/50"
            >Home</UButton
          >
        </RouterLink>
        <RouterLink to="/relays">
          <UButton
            variant="outline"
            class="nav-button uniform-height text-sm lg:text-base w-[8rem] ring-cyan-500 text-cyan-500 bg-cyan-100/50 hover:bg-cyan-100/50 dark:ring-cyan-400 dark:text-cyan-400 dark:bg-gray-800/50 dark:hover:bg-gray-800/50"
            >Relays</UButton
          >
        </RouterLink>
        <RouterLink to="/staking">
          <UButton
            variant="outline"
            class="nav-button uniform-height text-sm lg:text-base w-[8rem] ring-cyan-500 text-cyan-500 bg-cyan-100/50 hover:bg-cyan-100/50 dark:ring-cyan-400 dark:text-cyan-400 dark:bg-gray-800/50 dark:hover:bg-gray-800/50"
            >Staking</UButton
          >
        </RouterLink>
        <UButton
          color="gray"
          variant="soft"
          :to="`${runtimeConfig.public.githubNewIssueUrl}?template=bug_report.md`"
          target="_blank"
          class="w-[8rem] ring-1 ring-inset ring-neutral-200 dark:ring-neutral-700 bg-neutral-100 dark:bg-neutral-800/50 hover:dark:bg-neutral-800/25"
        >
          <UIcon name="i-heroicons-exclamation-circle" />
          <div>
            <span>Report Issue</span>
          </div>
        </UButton>
      </div>
      <div
        class="w-full bg-gradient-to-r from-neutral-600/10 via-cyan-600 to-neutral-600/10 h-px"
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
