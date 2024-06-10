<script setup lang="ts">
const isOpen = ref(false);
const userStore = useUserStore();
const { address } = storeToRefs(userStore);

if (address.value === null || address.value === undefined) {
  isOpen.value = true;
}

watch(address, (newAddress) => {
  if (newAddress === null || newAddress === undefined) {
    isOpen.value = true;
  } else {
    isOpen.value = false;
  }
});
</script>

<template>
  <UModal
    v-model="isOpen"
    :preventClose="true"
    :ui="{ shadow: 'shadow-cyan-800/40', ring: 'ring ring-cyan-400/20' }"
  >
    <div class="p-4 text-center flex flex-col gap-4 items-center">
      <h2>You need to be connected to view your account</h2>
      <WalletInput />
      <UKbd value="Verified: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8" />
      <UKbd value="Claimable: 0x9a6Af974b4Eb764D8B408a0C65317cDD2DE6E6F7" />
    </div>
  </UModal>
</template>
