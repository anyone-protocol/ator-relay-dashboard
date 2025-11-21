import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useHyperbeamFlag } from './useHyperbeamFlag';

export type FeatureFlag = 'experimentalHyperbeam';

interface FeatureFlagsState {
  [key: string]: boolean;
}

const STORAGE_KEY = 'ator_feature_flags';

export const useFeatureFlags = () => {
  const route = useRoute();
  const { hyperbeamEnabled, setEnabled: setHyperbeamEnabled } =
    useHyperbeamFlag();
  const flags = ref<FeatureFlagsState>({});

  const isFeatureFlag = (key: string): key is FeatureFlag => {
    const validFlags: FeatureFlag[] = ['experimentalHyperbeam'];
    return validFlags.includes(key as FeatureFlag);
  };

  const loadFromStorage = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        flags.value = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse feature flags from localStorage', e);
      }
    }
  };

  const processQueryParams = () => {
    const queryParams = route.query;
    Object.entries(queryParams).forEach(([key, value]) => {
      if (isFeatureFlag(key as FeatureFlag)) {
        const flagValue = value === 'true' || value === '1';
        flags.value[key] = flagValue;
      }
    });
  };

  const saveToStorage = () => {
    if (Object.keys(flags.value).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flags.value));
    }
  };

  const initializeFlags = () => {
    loadFromStorage();
    processQueryParams();
    saveToStorage();

    // Sync experimentalHyperbeam to useHyperbeamFlag
    if (flags.value.experimentalHyperbeam !== undefined) {
      setHyperbeamEnabled(flags.value.experimentalHyperbeam);
    }
  };

  // Initialize on first use
  initializeFlags();

  // Watch for URL query param changes
  watch(
    () => route.query,
    () => {
      initializeFlags();
    }
  );

  const getFlag = (flagKey: FeatureFlag): boolean => {
    return flags.value[flagKey] ?? false;
  };

  const setFlag = (flagKey: FeatureFlag, value: boolean) => {
    console.log(`[FeatureFlags] Setting ${flagKey} to ${value}`);
    flags.value[flagKey] = value;
    console.log(`[FeatureFlags] Flag state after update:`, flags.value);
    saveToStorage();

    // Sync to useHyperbeamFlag if setting experimentalHyperbeam
    if (flagKey === 'experimentalHyperbeam') {
      setHyperbeamEnabled(value);
    }
  };

  const resetFlags = () => {
    flags.value = {};
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    flags: flags as Readonly<typeof flags>,
    getFlag,
    setFlag,
    resetFlags,
  };
};
