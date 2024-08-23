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
    name: 'Sepolia ANYONe Token',
    address: config.public.sepoliaAtorTokenContract,
    type: 'evm',
  },
  {
    name: 'Distribution',
    address: config.public.distributionContract,
    type: 'arweave',
  },
  {
    name: 'Metrics Deployer',
    address: config.public.metricsDeployer,
    type: 'viewblock',
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
      return `https://sonar.warp.cc/#/app/contract/${address}?network=mainnet`;
    case 'viewblock':
      return `https://viewblock.io/arweave/address/${address}?network=mainnet`;
    default:
      return '#';
  }
};

const openCommitUrl = () => {
  const url = `https://github.com/ATOR-Development/ator-relay-dashboard/commit/${commitHash}`;
  window.open(url, '_blank');
};

const isOpen = ref(false);
</script>

<template>
  <footer
    class="bg-gradient-to-t max-w-[100vw] from-slate-100 to-teal-50 dark:from-zinc-900 dark:via-gray-900 py-4 px-6 mt-auto flex justify-between lg:justify-end items-end flex-col rounded-xl"
  >
    <UModal v-model="isOpen">
      <UCard class="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h4
          class="text-lg font-semibold mb-4 border-b border-b-[rgba(255,255,255,0.1)] pb-4"
        >
          View Contracts
        </h4>
        <UContainer class="">
          <div class="mb-6">
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
          </div>
          <div class="flex flex-end justify-end">
            <UButton
              variant="outline"
              size="sm"
              color="red"
              @click="isOpen = false"
            >
              Close
            </UButton>
          </div>
        </UContainer>
      </UCard>
    </UModal>

    <div class="flex justify-between items-center rounded-xl w-full">
      <div class="flex gap-2">
        <div class="font-brand tracking-wider">
          <UButton
            variant="outline"
            @click="isOpen = true"
            class="opacity-55 hover:opacity-100"
            >View Contracts</UButton
          >
        </div>
      </div>
      <div
        @click="openCommitUrl"
        class="text-sm text-gray-600 dark:text-gray-300 justify-self-center margin-auto hover:cursor-pointer"
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
