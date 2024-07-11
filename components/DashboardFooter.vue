<script setup lang="ts">
import ButtonThemeToggle from './ui-kit/ButtonThemeToggle.vue';
import { ref } from 'vue';

const config = useRuntimeConfig();

const version = config.public.version;
const commitHash = config.public.commitHash || 'dev';

const contractLinks = [
  {
    name: 'Relay Registry',
    address: config.public.relayRegistryAddress,
    type: 'arweave',
  },
  {
    name: 'Facilitator',
    address: config.public.facilitatorContract,
    type: 'evm',
  },
  {
    name: 'Sepolia ANON Token',
    address: config.public.sepoliaAtorTokenContract,
    type: 'evm',
  },
  {
    name: 'Distribution Contract',
    address: config.public.distributionContract,
    type: 'arweave',
  },
  {
    name: 'Metrics Deployer',
    address: config.public.metricsDeployer,
    type: 'arweave',
  },
  {
    name: 'Registrator',
    address: config.public.registratorContract,
    type: 'evm',
  },
];

const getLink = (address: string, type: string) => {
  switch (type) {
    case 'evmMain':
      return `https://etherscan.io/address/${address}`;
    case 'evm':
      return `https://sepolia.etherscan.io/address/${address}`;
    case 'arweave':
      return `https://sonar.warp.cc/#/app/contract/${address}`;
    default:
      return '#';
  }
};

const isOpen = ref(false);
</script>

<template>
  <footer
    class="bg-gradient-to-t from-slate-100 to-teal-50 dark:from-zinc-900 dark:via-gray-900 py-4 px-6 mt-auto flex justify-between lg:justify-center items-center flex-col rounded-xl"
  >
    <UModal v-model="isOpen">
      <UCard class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <template #header>
          <h4 class="text-lg font-semibold mb-4">Contract Links</h4>
        </template>

        <div class="space-y-4">
          <ul
            class="list-disc flex flex-col lg:grid lg:grid-cols-3 gap-2 text-center"
          >
            <li
              v-for="link in contractLinks"
              :key="link.address"
              class="ml-5 text-left"
            >
              <a
                :href="getLink(link.address, link.type)"
                target="_blank"
                class="text-sm text-cyan-800 dark:text-cyan-200 hover:underline"
              >
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>

        <template #footer>
          <UButton variant="outline" class="mt-4 w-full" @click="isOpen = false"
            >Close</UButton
          >
        </template>
      </UCard>
    </UModal>

    <div class="flex justify-between items-center rounded-xl w-full">
      <div class="flex gap-2">
        <div class="font-brand tracking-wider">
          <UButton variant="outline" @click="isOpen = true"
            >View Contracts</UButton
          >
        </div>
      </div>
      <div
        class="text-sm text-gray-600 dark:text-gray-300 justify-self-center margin-auto w-[50%]"
      >
        Version: {{ version }} | Commit: {{ commitHash }}
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
