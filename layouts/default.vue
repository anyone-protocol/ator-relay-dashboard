<script setup lang="ts">
const config = useRuntimeConfig();

const version = config.public.version;
onMounted(() => {
  console.log('Dashboard version:', version);
});
</script>

<template>
  <main
    class="relative isolate h-full min-h-screen bg-neutral-50 dark:bg-neutral-900"
  >
    <!-- <div
      class="absolute top-0 w-full bg-yellow-400 text-black text-center text-xs font-medium py-1"
    >
      The Anyone Protocol Dashboard is currently migrating from Testnet to
      Mainnet. Operators should not interact. See
      <a class="underline" href="https://t.me/anyonedevelopment/181">
        details
      </a>
    </div> -->
    <div class="xl:p-6">
      <div
        class="mx-auto w-full max-w-screen-2xl h-[calc(100vh-0px)] sm:h-[calc(100vh-50px)] lg:h-[calc(100vh-0px)] xl:h-[calc(100vh-50px)] xl:rounded-xl flex flex-col"
      >
        <DashboardHeader />
        <div
          id="scrollArea"
          class="flex-1 min-h-0 overflow-y-auto px-6 lg:grid lg:grid-cols-8 lg:gap-6"
        >
          <section
            class="relative flex flex-col gap-6 lg:col-span-8 lg:mt-6 max-h-full overflow-auto"
          >
            <slot></slot>
          </section>
          <DashboardMobileMenu />
        </div>
        <DashboardFooter />
      </div>
    </div>
  </main>
  <UNotifications />
</template>
