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
  <div
    class="tabs after:bg-gradient-to-r dark:after:from-cyan-600 dark:after:to-gray-900 after:from-cyan-300 after:to-gray-200"
  >
    <div
      v-for="(tab, index) in tabs"
      :key="tab.key"
      :class="[
        'tab',
        {
          'tab-active bg-clip-text bg-gradient-to-r dark:from-cyan-300 dark:to-cyan-600 from-cyan-500 to-cyan-600 after:bg-gradient-to-r dark:after:from-cyan-300 dark:after:to-cyan-600 after:from-cyan-500 after:to-cyan-600':
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
  text-align: center;
  display: flex;
  width: 100%;
  margin-bottom: 24px;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 1px;
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
  }

  .tab-active {
    color: transparent;
    font-weight: 500;
  }
}
</style>
