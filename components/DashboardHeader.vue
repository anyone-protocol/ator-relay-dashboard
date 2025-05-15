<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useMenuStore } from '@/stores/useMenuStore'; // Assuming you have this store
import ButtonConnect from './ui-kit/ButtonConnect.vue';
import ButtonMobileMenu from './ui-kit/ButtonMobileMenu.vue';
import ButtonThemeToggle from './ui-kit/ButtonThemeToggle.vue';
import TitleAndLogo from './ui-kit/TitleAndLogo.vue';
import ReportIssueButton from '@/components/ui-kit/ReportIssueButton.vue';
import ReportIssueDialog from '@/components/ui-kit/ReportIssueDialog.vue';
import { useAccount } from '@wagmi/vue';

import { config } from '@/config/wagmi.config';

const { isConnected, address } = useAccount({ config } as any);

const menuStore = useMenuStore();
</script>

<template>
  <header
    :class="[menuStore.isStuck ? 'z-0' : 'z-20']"
    class="lg:relative sticky top-0"
  >
    <div
      class="absolute w-full inset-0 dark:h-28 h-20 [mask-image:linear-gradient(to_bottom,black_90%,transparent)] lg:hidden"
    ></div>
    <div
      class="flex justify-between items-center px-6 pb-4 lg:pt-6 pt-4 relative h-full"
    >
      <div class="flex gap-2 items-center">
        <TitleAndLogo />
      </div>
      <nav class="flex-1 h-full">
        <ul class="flex justify-center items-center space-x-2 lg:space-x-4">
          <li>
            <RouterLink to="/" v-slot="{ isActive }">
              <UButton
                variant="outline"
                class="nav-button uniform-height text-sm lg:text-base lg:flex hidden"
                :class="[
                  isActive
                    ? 'ring-cyan-500 text-cyan-500 bg-cyan-100/50 hover:bg-cyan-100/50 dark:ring-cyan-400 dark:text-cyan-400 dark:bg-gray-800/50 dark:hover:bg-gray-800/50'
                    : 'ring-neutral-200 text-neutral-950 hover:bg-neutral-100/50 dark:ring-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-800/50',
                ]"
                >Home</UButton
              >
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/relays" v-slot="{ isActive }">
              <UButton
                variant="outline"
                class="nav-button uniform-height text-sm lg:text-base lg:flex hidden"
                :class="[
                  isActive
                    ? 'ring-cyan-500 text-cyan-500 bg-cyan-100/50 hover:bg-cyan-100/50 dark:ring-cyan-400 dark:text-cyan-400 dark:bg-gray-800/50 dark:hover:bg-gray-800/50'
                    : 'ring-neutral-200 text-neutral-950 hover:bg-neutral-100/50 dark:ring-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-800/50',
                ]"
                >Relays</UButton
              >
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/staking" v-slot="{ isActive }">
              <UButton
                variant="outline"
                class="nav-button uniform-height text-sm lg:text-base lg:flex hidden"
                :class="[
                  isActive
                    ? 'ring-cyan-500 text-cyan-500 bg-cyan-100/50 hover:bg-cyan-100/50 dark:ring-cyan-400 dark:text-cyan-400 dark:bg-gray-800/50 dark:hover:bg-gray-800/50'
                    : 'ring-neutral-200 text-neutral-950 hover:bg-neutral-100/50 dark:ring-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-800/50',
                ]"
                >Staking</UButton
              >
            </RouterLink>
          </li>
          <div class="lg:flex items-center gap-2 hidden h-full">
            <ReportIssueButton class="uniform-height" v-if="isConnected" />
          </div>
        </ul>
      </nav>
      <div class="flex items-center gap-2">
        <ButtonMobileMenu class="uniform-height" />
      </div>
      <div class="lg:flex items-center hidden ml-auto mr-4">
        <ButtonConnect class="uniform-height" />
      </div>
      <div class="lg:flex items-center gap-2 hidden">
        <ButtonThemeToggle class="uniform-height" />
      </div>
    </div>

    <!-- <ReportIssueDialog /> -->
  </header>
</template>

<style scoped>
nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
nav ul li {
  margin: 0;
}

.uniform-height {
  height: 2.3rem;
}

/* .dark .nav-button {
  background-color: #141313;
  box-shadow: 0 0 0 1px #555;
  color: #d6d6d6;
}

.dark .router-link-active .nav-button {
  box-shadow: 0 0 0 1px rgb(5, 190, 223);
  color: rgb(5, 190, 223);
}
.router-link-active .nav-button {
  background-color: transparent;
  color: #000;
} */
</style>
