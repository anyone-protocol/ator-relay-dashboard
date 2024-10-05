// useHardwareStatus.ts
import { reactive, ref } from 'vue';
import { useUserStore } from '@/stores/useUserStore';

export const useHardwareStatus = () => {
  const isHardwareResolved = reactive<Record<string, boolean>>({});
  const userStore = useUserStore();

  const resolveHardwareStatus = async (fingerprints: string[]) => {
    // Fetch the cached data once
    const cache = useRelayCache();
    const cachedData = await cache.getRelayData();

    // Check the cache for hardware verification
    if (cachedData && cachedData.verifiedHardware) {
      fingerprints.forEach((fingerprint) => {
        isHardwareResolved[fingerprint] =
          !!cachedData.verifiedHardware[fingerprint];
      });
    } else {
      // If no cache data or hardware verification available, default to false
      fingerprints.forEach((fingerprint) => {
        isHardwareResolved[fingerprint] = false;
      });
    }
  };

  return { isHardwareResolved, resolveHardwareStatus };
};
