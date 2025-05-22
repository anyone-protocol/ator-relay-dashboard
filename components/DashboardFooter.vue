<script setup lang="ts">
const config = useRuntimeConfig();

const version = config.public.version;
const commitHash = config.public.commitHash || 'dev';

const openCommitUrl = () => {
  const url = `https://github.com/anyone-protocol/ator-relay-dashboard/commit/${commitHash}`;
  window.open(url, '_blank');
};
</script>

<template>
  <footer
    class="max-w-[100vw] py-4 px-6 mt-auto flex justify-between lg:justify-end items-end flex-col rounded-xl"
  >
    <div class="flex justify-between items-center rounded-xl w-full">
      <div
        @click="openCommitUrl"
        class="text-sm text-neutral-600 dark:text-neutral-300 justify-self-center margin-auto hover:cursor-pointer"
      >
        Version: {{ version }} | Commit: {{ commitHash.slice(0, 7) }}...
      </div>
    </div>
  </footer>
</template>
<style scoped>
@media (min-width: 1024px) {
  ul.list-disc {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
