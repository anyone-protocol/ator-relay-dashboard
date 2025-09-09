<script setup lang="ts">
import ReportIssueDialog from '@/components/ui-kit/ReportIssueDialog.vue';
import ReportIssueButton from '@/components/ui-kit/ReportIssueButton.vue';
import { useAccount } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';

const runtimeConfig = useRuntimeConfig();
const { isConnected } = useAccount({ config } as any);

const version = runtimeConfig.public.version;
const commitHash = runtimeConfig.public.commitHash || 'dev';

const openCommitUrl = () => {
  const url = `https://github.com/anyone-protocol/ator-relay-dashboard/commit/${commitHash}`;
  window.open(url, '_blank');
};

const isOpen = ref(false);

const contractLinks = [
  {
    name: 'Operator Registry Process',
    address: runtimeConfig.public.operatorRegistryProcessId,
    type: 'ao',
  },
  {
    name: 'Sepolia Hodler Contract',
    address: runtimeConfig.public.hodlerContract,
    type: 'evm',
  },
  {
    name: 'Sepolia ANyONe Token',
    address: runtimeConfig.public.sepoliaAtorTokenContract,
    type: 'evm',
  },
  {
    name: 'Relay Rewards Process',
    address: runtimeConfig.public.relayRewardsProcessId,
    type: 'ao',
  },
  {
    name: 'Staking Rewards Process',
    address: runtimeConfig.public.stakingRewardsProcessId,
    type: 'ao',
  },
  {
    name: 'Metrics Uploader',
    address: runtimeConfig.public.metricsDeployer,
    type: 'viewblock',
  },
  {
    name: 'Distribution Uploader',
    address: runtimeConfig.public.distributionDeployer,
    type: 'viewblock',
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
      return `https://viewblock.io/arweave/address/${address}`;
    case 'ao':
      return `https://ao.link/#/entity/${address}`;
    default:
      return '#';
  }
};
</script>

<template>
  <footer
    class="max-w-[100vw] py-4 px-6 mt-auto flex justify-between lg:justify-end items-end flex-col rounded-xl"
  >
    <div class="flex justify-between items-center rounded-xl w-full">
      <div class="lg:flex items-center gap-2 hidden h-full">
        <ReportIssueButton class="uniform-height" v-if="isConnected" />
      </div>

      <div class="lg:flex hidden ml-3 mr-auto">
        <UButton
          @click="isOpen = true"
          variant="soft"
          color="gray"
          class="ring-1 ring-inset ring-neutral-200 dark:ring-neutral-700 bg-neutral-100 dark:bg-neutral-800/50 hover:dark:bg-neutral-800/25"
        >
          View Contracts
        </UButton>
      </div>

      <ReportIssueDialog />

      <div
        @click="openCommitUrl"
        class="text-sm text-neutral-600 dark:text-neutral-300 justify-self-center margin-auto hover:cursor-pointer"
      >
        Version: {{ version }} | Commit: {{ commitHash.slice(0, 7) }}...
      </div>
    </div>

    <UModal v-model="isOpen">
      <UCard class="bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
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
