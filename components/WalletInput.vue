<script setup lang="ts">
import { isAddress } from 'viem';

const toast = useToast();
const userStore = useUserStore();
const address = ref(userStore.address);

const applyAddress = () => {
  if (address.value && isAddress(address.value)) {
    userStore.$patch({ address: address.value });
    userStore.$patch({ userData: { address: address.value } });
    debugger;
    toast.add({
      title: `Applying data for ${truncatedAddress(address.value)}`,
    });
  } else {
    toast.add({ title: 'Invalid address' });
  }
};
</script>

<template>
  <UButtonGroup size="sm" orientation="horizontal">
    <UInput v-model.trim="address" />
    <UButton color="gray" @click="applyAddress">Apply</UButton>
  </UButtonGroup>
</template>
