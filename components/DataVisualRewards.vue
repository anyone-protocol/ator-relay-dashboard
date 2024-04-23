<script lang="ts" setup>
import Chart from "chart.js/auto";

const distributionOverMonths = ref();
const hasHistory = ref(false);

const data = {
  labels: ["January", "February", "March", "April", "May", "June"],
  datasets: [
    {
      fill: false,
      tension: 0.4,
      borderColor: "#06b6d4",
      backgroundColor: "rgba(34, 211, 238, 0.35)",
      data: [65, 59, 80, 81, 56, 55],
    },
  ],
};

onMounted(() => {
  new Chart(distributionOverMonths.value, {
    type: "line",
    data,
    options: {
      datasets: {
        line: {
          pointBackgroundColor: "#0d9488",
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            display: false,
          },
        },
        y: {
          display: false,
        },
      },
    },
  });
});
</script>

<template>
  <div
    class="full-bleed lg:not-full-bleed relative flex flex-col justify-end sm:pb-12 pt-28 lg:h-auto lg:flex-row lg:pb-0 lg:pt-0">
    <LazyBadge v-if="hasHistory" class="absolute bottom-6 right-4">
      <Icon name="heroicons:arrow-trending-up-solid"></Icon>Chart shows rewards
      over time
    </LazyBadge>

    <div v-if="hasHistory" class="relative h-auto w-full">
      <canvas ref="distributionOverMonths"
        class="[mask-image:linear-gradient(to_bottom,black,transparent)] hover:[mask-image:none]"></canvas>
    </div>

    <Badge v-else class="sm:px-6 mb-24 sm:mr-16 sm:ml-8 w-full sm:w-fit">
      <div class="flex flex-col gap-2 py-8 px-6">
        <div class="flex items-center gap-2 mb-4">
          <Icon :name="`heroicons:information-circle`" class="h-6 w-6 text-teal-600"></Icon>
          <h2 class="sm:text-2xl text-xl">You have no rewards history yet.</h2>
        </div>
        <p class="dark:text-gray-200">If you recently set up your relay it might take some time before you can claim
          rewards.
        </p>
        <p class="dark:text-gray-200">You can learn more about <a
            href="https://relayseries.ator.io/welcome/welcome-to-ator-relay-education" target="_blank"
            rel="noopener noreferrer" class="dark:text-teal-400 text-gray-800 hover:text-teal-500">setting up your own
            relays here.</a>
        </p>
      </div>
    </Badge>
  </div>
</template>
