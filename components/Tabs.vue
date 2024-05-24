<script setup lang="ts">
const emit = defineEmits<{
  (e: 'onChange', key: string): void;
}>();

const props = defineProps<{
  tabs: {
    key: string;
    label: string;
  }[];
}>();

const currentTab = ref<string>(props.tabs[0].key);

const changeTab = (key: string) => {
  currentTab.value = key;
  emit('onChange', key);
};
</script>

<template>
  <div class="tabs">
    <div
      v-for="(tab, index) in tabs"
      :key="tab.key"
      :class="[
        'tab text-gray-900 dark:text-white',
        {
          'tab-active bg-clip-text bg-gradient-to-r dark:from-cyan-300 dark:to-cyan-600 from-cyan-500 to-cyan-600':
            currentTab === tab.key,
        },
      ]"
      @click="changeTab(tab.key)"
    >
      {{ tab.label }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.tabs {
  position: relative;
  display: flex;
  width: 100%;
  margin-bottom: 24px;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, #165167 0%, rgba(22, 81, 103, 0) 100%);
  }
}

.tabs {
  .tab {
    position: relative;
    cursor: pointer;
    padding: 6px 20px;
    font-weight: 400;
    font-size: 16px;
  }

  .tab-active::after {
    position: absolute;
    z-index: 1;
    bottom: 0;
    left: 0;
    content: '';
    display: block;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, #5ce1f5 0%, #0c9dc0 100%);
  }

  .tab-active {
    color: transparent;
    font-weight: 500;
  }
}
</style>
