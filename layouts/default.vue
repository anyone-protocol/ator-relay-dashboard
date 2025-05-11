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
    <div class="xl:p-6">
      <div
        class="mx-auto w-full max-w-screen-2xl xl:rounded-xl h-[calc(100vh-0px)] sm:h-[calc(100vh-50px)] flex flex-col gap-10 lg:gap-0"
      >
        <DashboardHeader />

        <div
          id="scrollArea"
          class="h-[calc(100svh-62px)] sm:h-full overflow-y-auto px-6 pb-16 [mask-image:linear-gradient(to_bottom,black_90%,transparent)] lg:grid lg:h-auto lg:grid-cols-8 lg:gap-6"
        >
          <section class="relative flex flex-col gap-6 lg:col-span-8 lg:mt-6">
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
