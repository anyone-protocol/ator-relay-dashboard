<script setup lang="ts">
import GlowEffect from '~/components/ui-kit/GlowEffect.vue';
</script>

<template>
  <main
    class="relative isolate h-full min-h-screen bg-gradient-to-br from-teal-800 via-teal-100 to-cyan-900 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900">
    <div class="xl:p-6">
      <GlowEffect />

      <div
        class="mx-auto w-full max-w-screen-2xl bg-neutral-300/60 ring-0 dark:bg-cyan-950/10 lg:shadow-2xl lg:shadow-teal-900 lg:ring-4 lg:ring-teal-800/20 dark:lg:shadow-cyan-300 dark:lg:ring-1 dark:lg:ring-cyan-400 xl:rounded-xl">
        <DashboardHeader />

        <div id="scrollArea"
          class="h-[calc(100svh-62px)] sm:h-full snap-y snap-mandatory scroll-pt-4 overflow-y-auto scroll-smooth px-6 pb-16 [mask-image:linear-gradient(to_bottom,black_90%,transparent)] lg:grid lg:h-auto lg:grid-cols-8 lg:gap-6">
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
