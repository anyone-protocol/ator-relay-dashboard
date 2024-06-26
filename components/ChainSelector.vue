<script setup lang="ts">
import { switchChain, watchAccount, watchChainId } from '@wagmi/core';
import { useAccount } from '@wagmi/vue';
import { config, defaultChain } from '@/config/wagmi.config';

const { chainId } = useAccount({ config });

const unwatch = watchAccount(config, {
  onChange(data) {
    console.log('Account changed!', data);
  },
});
const unwatchChainId = watchChainId(config, {
  onChange(data) {
    console.log('Chain ID changed!', data);
  },
});
unwatch();
unwatchChainId();
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="h-10 w-10 rounded-full bg-teal-800/10 ring ring-cyan-100/10">
      <Icon
        v-if="chainId === defaultChain.id"
        name="cryptocurrency-color:eth"
        class="h-10 w-10"
      />
      <Icon v-else name="iwwa:alarm-o" class="h-10 w-10 text-red-500" />
    </div>
    <span
      v-if="chainId === defaultChain.id"
      class="hidden text-xs dark:text-gray-300 lg:block"
      >Connected to the<br />Ethereum network</span
    >
    <button
      v-else
      class="hidden text-xs dark:text-red-500 lg:block"
      @click="() => switchChain(config, { chainId: defaultChain.id })"
    >
      Connected to <br />Wrong network
    </button>
  </div>
</template>
