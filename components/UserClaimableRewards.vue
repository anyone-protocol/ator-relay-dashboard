<script setup lang="ts">
const userStore = useUserStore();
</script>

<template>
  <span>
    {{ userStore.claimableRewards }}
  </span>
</template>
