<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useWeb3Modal } from "@web3modal/wagmi/vue";
const userStore = useUserStore();

const { open } = useWeb3Modal();
const { userData } = storeToRefs(userStore);
</script>

<template>
  <button v-if="userData.address" type="button" class="flex gap-3 items-center text-left"
    @click="open({ view: 'Account' })">
    <Icon name="heroicons:user-circle"
      class="dark:text-cyan-100 w-8 h-8 ring ring-cyan-600 rounded-full relative bg-slate-200/50 dark:bg-transparent" />

    <div class="flex flex-col flex-wrap gap-1">
      <span class="dark:text-white text-xs uppercase">{{ userData.status }}</span>
      <Address :address="userData.address" />
    </div>
  </button>

  <UButton v-if="userData.isDisconnected" variant="outline" @click="open({ view: 'Connect' })">
    Connect wallet
  </UButton>

  <div v-if="userData.isReconnecting || userData.isConnecting" class="px-3 py-2" :aria-label="userData.status">
    <Icon name="eos-icons:three-dots-loading" class="dark:text-cyan-300" />
    <span class="sr-only">{{ userData.status }}</span>
  </div>
</template>
