import { ref, computed } from 'vue';

const STORAGE_KEY = 'ator_hyperbeam_enabled';

// Shared state across all instances
const hyperbeamEnabledRef = ref<boolean | null>(null);
let initialized = false;

/**
 * Reactive composable for hyperbeam feature flag
 * Persists state to localStorage for cross-refresh persistence
 * Single source of truth for all queries
 * Note: Hyperbeam is always disabled on live/mainnet
 */
export const useHyperbeamFlag = () => {
  const config = useRuntimeConfig();
  const appEnv = config.public.appEnv;

  // Initialize on first use
  if (!initialized) {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Force hyperbeam off on live
    hyperbeamEnabledRef.value = appEnv === 'live' ? false : stored === 'true';
    initialized = true;
  }

  const setEnabled = (value: boolean) => {
    // Prevent enabling hyperbeam on live
    if (appEnv === 'live') {
      hyperbeamEnabledRef.value = false;
      localStorage.setItem(STORAGE_KEY, 'false');
      return;
    }

    hyperbeamEnabledRef.value = value;
    localStorage.setItem(STORAGE_KEY, String(value));
  };

  const hyperbeamEnabled = computed(() => hyperbeamEnabledRef.value ?? false);

  return {
    hyperbeamEnabled,
    setEnabled,
  };
};
