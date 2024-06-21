<script setup lang="ts">
import ButtonThemeToggle from './ui-kit/ButtonThemeToggle.vue';

const config = useRuntimeConfig();

const version = '1.0.0';
const commitHash = config.public.commitHash || 'dev';
</script>

<template>
   <footer
      class="bg-gradient-to-t from-slate-100 to-teal-50 dark:from-zinc-900 dark:via-gray-900 py-4 px-6 mt-auto flex justify-between lg:justify-center  items-center rounded-xl">
      <div class="flex gap-2">
         <TitleAndLogo />
         <h1 class="lg:hidden capitalize font-brand tracking-wider">ATOR</h1>
      </div>

      <div class="text-sm text-gray-600 dark:text-gray-300  justify-self-center margin-auto">
         Version: {{ version }} | Commit: {{ commitHash }}
      </div>

      <div class="lg:hidden flex items-center gap-2">
         <ButtonThemeToggle />
      </div>
   </footer>
</template>
