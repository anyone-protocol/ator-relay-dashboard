import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import { useOperatorRegistry } from '../operator-registry';
import { useRelayCache } from '../relayCache';
import Logger from '~/utils/logger';

const logger = new Logger('useRelayQueries');

/**
 * Fetch relay info (verified, claimable, hardware, registration credits)
 */
export const useRelayInfoQuery = (
  address: Ref<string | undefined> | ComputedRef<string | undefined>
) => {
  return useQuery({
    queryKey: computed(() => ['relayInfo', address.value]),
    queryFn: async () => {
      if (!address.value) return null;

      const operatorRegistry = useOperatorRegistry();
      const relayInfo = await operatorRegistry.getRelayInfoForAddress(
        address.value
      );

      if (!relayInfo) {
        return null;
      }

      // Save to cache
      const relayCache = useRelayCache();
      await relayCache.saveRelayData(relayInfo);

      logger.info('Relay info fetched and cached', relayInfo);

      return relayInfo;
    },
    enabled: computed(() => !!address.value),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
  });
};

/**
 * Transform relay info into list of verified + claimable relays
 */
export const useAllRelaysQuery = (
  address: Ref<string | undefined> | ComputedRef<string | undefined>
) => {
  const relayInfoQuery = useRelayInfoQuery(address);

  return computed(() => {
    const relayInfo = relayInfoQuery.data.value;
    if (!relayInfo) return [];

    return [
      ...relayInfo.verified.map((fingerprint) => ({
        fingerprint,
        status: 'verified' as const,
        consensusWeight: 0,
        observedBandwidth: 0,
        active: true,
        class: '',
        isWorking: false,
        nickname: '',
      })),
      ...relayInfo.claimable.map((fingerprint) => ({
        fingerprint,
        status: 'claimable' as const,
        consensusWeight: 0,
        observedBandwidth: 0,
        active: true,
        class: '',
        isWorking: false,
        nickname: '',
      })),
    ];
  });
};

/**
 * Get hardware status for fingerprints
 */
export const useHardwareStatusQuery = (
  address: Ref<string | undefined> | ComputedRef<string | undefined>
) => {
  const relayInfoQuery = useRelayInfoQuery(address);

  return computed(() => {
    const relayInfo = relayInfoQuery.data.value;
    if (!relayInfo) return {};

    const hardwareStatusMap: Record<string, boolean> = {};
    const allFingerprints = [...relayInfo.verified, ...relayInfo.claimable];

    allFingerprints.forEach((fingerprint) => {
      hardwareStatusMap[fingerprint] =
        relayInfo.verifiedHardware.includes(fingerprint);
    });

    return hardwareStatusMap;
  });
};

/**
 * Get registered relays count
 */
export const useRegisteredRelaysCountQuery = (
  address: Ref<string | undefined> | ComputedRef<string | undefined>
) => {
  const allRelaysQuery = useAllRelaysQuery(address);

  return computed(() => allRelaysQuery.value.length);
};

/**
 * Get hardware relays count
 */
export const useHardwareRelaysCountQuery = (
  address: Ref<string | undefined> | ComputedRef<string | undefined>
) => {
  const allRelaysQuery = useAllRelaysQuery(address);
  const hardwareStatusQuery = useHardwareStatusQuery(address);

  return computed(() => {
    return allRelaysQuery.value.filter(
      (relay) => relay.active && hardwareStatusQuery.value[relay.fingerprint]
    ).length;
  });
};

/**
 * Get claimed relays count
 */
export const useClaimedRelaysCountQuery = (
  address: Ref<string | undefined> | ComputedRef<string | undefined>
) => {
  const allRelaysQuery = useAllRelaysQuery(address);

  return computed(() => {
    return allRelaysQuery.value.filter(
      (relay) => relay.active && relay.status === 'verified'
    ).length;
  });
};

/**
 * Combined hook for all relay metrics
 */
export const useRelayMetricsQueries = (
  address: Ref<string | undefined> | ComputedRef<string | undefined>
) => {
  const relayInfoQuery = useRelayInfoQuery(address);
  const allRelaysQuery = useAllRelaysQuery(address);
  const hardwareStatusQuery = useHardwareStatusQuery(address);
  const registeredCountQuery = useRegisteredRelaysCountQuery(address);
  const hardwareCountQuery = useHardwareRelaysCountQuery(address);
  const claimedCountQuery = useClaimedRelaysCountQuery(address);

  return {
    relayInfoQuery,
    allRelaysQuery,
    hardwareStatusQuery,
    registeredCountQuery,
    hardwareCountQuery,
    claimedCountQuery,
    isPending: computed(() => relayInfoQuery.isPending.value),
    isError: computed(() => relayInfoQuery.isError.value),
  };
};
