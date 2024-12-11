import { useUserStore } from '@/stores/useUserStore';

export const fetchHardwareStatus = async (fingerprints: string[]) => {
  const userStore = useUserStore();

  // Fetch the cached data once
  const cache = useRelayCache();
  const cachedData = await cache.getRelayData();
  console.log(
    'fetchHardwareStatus(fingerprints), cachedData',
    fingerprints,
    cachedData
  );
  const hardwareStatusMap: Record<string, boolean> = {};

  // Check the cache for hardware verification
  if (cachedData && cachedData.verifiedHardware) {
    fingerprints.forEach((fingerprint) => {
      hardwareStatusMap[fingerprint] =
        cachedData.verifiedHardware.includes(fingerprint); // !!cachedData.verifiedHardware[fingerprint];
    });
  } else {
    // If no cache data or hardware verification available, default to false
    fingerprints.forEach((fingerprint) => {
      hardwareStatusMap[fingerprint] = false;
    });
  }

  console.log('fetchHardwareStatus() hardwareStatusMap', hardwareStatusMap);

  return hardwareStatusMap;
};
