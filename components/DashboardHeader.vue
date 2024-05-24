<script setup lang="ts">
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
        <h1 class="lg:hidden capitalize font-brand tracking-wider">ATOR</h1>
      </div>

      <div class="flex items-center gap-2">
        <ButtonMobileMenu />
      </div>

      <div class="lg:flex items-center hidden ml-auto mr-6">
        <ButtonConnect />
        <!-- <WalletInput /> -->
      </div>

      <div class="lg:flex items-center gap-2 hidden">
        <ButtonThemeToggle />
      </div>
    </div>
  </header>
</template>
