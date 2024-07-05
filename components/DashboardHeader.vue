<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useMenuStore } from '@/stores/useMenuStore'; // Assuming you have this store
import ButtonConnect from './ui-kit/ButtonConnect.vue';
import ButtonMobileMenu from './ui-kit/ButtonMobileMenu.vue';
import ButtonThemeToggle from './ui-kit/ButtonThemeToggle.vue';
import TitleAndLogo from './ui-kit/TitleAndLogo.vue';

const menuStore = useMenuStore();
</script>

<template>
  <header
    :class="[menuStore.isStuck ? 'z-0' : 'z-20']"
    class="lg:relative sticky top-0"
  >
    <div
      class="absolute dark:bg-gradient-to-b dark:from-zinc-900 dark:via-gray-900 bg-gradient-to-b from-slate-100 to-teal-50 w-full inset-0 dark:h-28 h-20 [mask-image:linear-gradient(to_bottom,black_90%,transparent)] lg:hidden"
    ></div>
    <div
      class="flex justify-between items-center px-6 pb-4 lg:pt-6 pt-4 relative"
    >
      <div class="flex gap-2">
        <TitleAndLogo />
        <h1 class="lg:hidden capitalize font-brand tracking-wider">ANON</h1>
      </div>
      <nav class="flex-1">
        <ul class="flex justify-center items-center space-x-4">
          <li>
            <RouterLink to="/">
              <UButton variant="outline" class="nav-button">Home</UButton>
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/relays">
              <UButton variant="outline" class="nav-button">Relays</UButton>
            </RouterLink>
          </li>
        </ul>
      </nav>
      <div class="flex items-center gap-2">
        <ButtonMobileMenu />
      </div>
      <div class="lg:flex items-center hidden ml-auto mr-6">
        <ButtonConnect />
      </div>
      <div class="lg:flex items-center gap-2 hidden">
        <ButtonThemeToggle />
      </div>
    </div>
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

.dark .router-link-active .nav-button {
  background-color: #000;
  color: white;
}
.router-link-active .nav-button {
  background-color: #fff;
  color: #000;
}
</style>
