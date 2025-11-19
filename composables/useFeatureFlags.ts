import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export type FeatureFlag = 'experimentalHyperbeam';

interface FeatureFlagsState {
  [key: string]: boolean;
}

const STORAGE_KEY = 'ator_feature_flags';

export const useFeatureFlags = () => {
  const route = useRoute();
  const flags = ref<FeatureFlagsState>({});

  const initializeFlags = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          flags.value = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse feature flags from localStorage', e);
        }
      }

      const queryParams = route.query;
      Object.entries(queryParams).forEach(([key, value]) => {
        if (isFeatureFlag(key as FeatureFlag)) {
          const flagValue = value === 'true' || value === '1';
          if (flagValue !== flags.value[key]) {
            flags.value[key] = flagValue;
          }
        }
      });

      if (Object.keys(flags.value).length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(flags.value));
      }
    }
  };

  // Check if key is a valid feature flag
  const isFeatureFlag = (key: string): key is FeatureFlag => {
    const validFlags: FeatureFlag[] = ['experimentalHyperbeam'];
    return validFlags.includes(key as FeatureFlag);
  };

  const getFlag = (flagKey: FeatureFlag): boolean => {
    return flags.value[flagKey] ?? false;
  };

  const setFlag = (flagKey: FeatureFlag, value: boolean) => {
    flags.value[flagKey] = value;
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flags.value));
    }
  };

  const resetFlags = () => {
    flags.value = {};
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Initialize on mount
  if (import.meta.client) {
    initializeFlags();
  }

  return {
    flags: flags as Readonly<typeof flags>,
    getFlag,
    setFlag,
    resetFlags,
  };
};
