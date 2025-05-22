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
const runtimeConfig = useRuntimeConfig();

const isOpen = ref(false);

const contractLinks = [
  {
    name: 'Operator Registry',
    address: runtimeConfig.public.operatorRegistryProcessId,
    type: 'ao',
  },
  {
    name: 'Facilitator',
    address: runtimeConfig.public.facilitatorContract,
    type: 'evm',
  },
  {
    name: 'Hodler',
    address: runtimeConfig.public.hodlerContract,
    type: 'evm',
  },
  {
    name: 'Sepolia ANYONE Token',
    address: runtimeConfig.public.sepoliaAtorTokenContract,
    type: 'evm',
  },
  {
    name: 'Relay Rewards',
    address: runtimeConfig.public.relayRewardsProcessId,
    type: 'ao',
  },
  {
    name: 'Metrics Deployer',
    address: runtimeConfig.public.metricsDeployer,
    type: 'viewblock',
  },
  {
    name: 'Distribution Deployer',
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
        <ul class="flex justify-center items-center space-x-2 lg:space-x-3">
          <div
            class="flex items-center gap-1 ring-1 ring-neutral-200 dark:ring-neutral-800 p-1 rounded-md"
          >
            <li>
              <RouterLink to="/" v-slot="{ isActive }">
                <UButton
                  class="nav-button uniform-height text-sm lg:text-base lg:flex hidden"
                  variant="soft"
                  :color="isActive ? 'primary' : 'gray'"
                  >Home</UButton
                >
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/relays" v-slot="{ isActive }">
                <UButton
                  class="nav-button uniform-height text-sm lg:text-base lg:flex hidden"
                  variant="soft"
                  :color="isActive ? 'primary' : 'gray'"
                  >Relays</UButton
                >
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/staking" v-slot="{ isActive }">
                <UButton
                  class="nav-button uniform-height text-sm lg:text-base lg:flex hidden"
                  variant="soft"
                  :color="isActive ? 'primary' : 'gray'"
                  >Staking</UButton
                >
              </RouterLink>
            </li>
          </div>
          <div class="lg:flex items-center gap-2 hidden h-full">
            <ReportIssueButton class="uniform-height" v-if="isConnected" />
          </div>
        </ul>
      </nav>
      <div class="flex items-center gap-2">
        <ButtonMobileMenu class="uniform-height" />
      </div>
      <div class="lg:flex hidden ml-auto mr-4">
        <UButton
          @click="isOpen = true"
          variant="soft"
          color="gray"
          class="ring-1 ring-inset ring-neutral-200 dark:ring-neutral-700 bg-neutral-100 dark:bg-neutral-800/50 hover:dark:bg-neutral-800/25"
        >
          View Contracts
        </UButton>
      </div>
      <div class="lg:flex items-center hidden ml-auto mr-4">
        <ButtonConnect class="uniform-height" />
      </div>
      <div class="lg:flex items-center gap-2 hidden">
        <ButtonThemeToggle class="uniform-height" />
      </div>
    </div>

    <ReportIssueDialog />

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
