import { ref, computed } from 'vue';

const STORAGE_KEY = 'ator_hyperbeam_enabled';

// Shared state across all instances
const hyperbeamEnabledRef = ref<boolean | null>(null);
let initialized = false;

/**
 * Reactive composable for hyperbeam feature flag
 * Persists state to localStorage for cross-refresh persistence
 * Single source of truth for all queries
 */
export const useHyperbeamFlag = () => {
  // Initialize on first use
  if (!initialized) {
    const stored = localStorage.getItem(STORAGE_KEY);
    hyperbeamEnabledRef.value = stored === 'true';
    initialized = true;
  }

  const setEnabled = (value: boolean) => {
    hyperbeamEnabledRef.value = value;
    localStorage.setItem(STORAGE_KEY, String(value));
  };

  const hyperbeamEnabled = computed(() => hyperbeamEnabledRef.value ?? false);

  return {
    hyperbeamEnabled,
    setEnabled,
  };
};
