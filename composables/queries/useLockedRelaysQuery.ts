import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import { useHodler } from '../hodler';
import Logger from '~/utils/logger';

const logger = new Logger('useLockedRelaysQuery');

/**
 * Fetch locked relays data from hodler contract
 */
export const useLockedRelaysQuery = (
  address: Ref<string | undefined> | ComputedRef<string | undefined>
) => {
  return useQuery({
    queryKey: computed(() => ['lockedRelays', address.value]),
    queryFn: async () => {
      if (!address.value) return null;

      try {
        const hodler = useHodler();
        if (!hodler) {
          logger.warn('Hodler not initialized');
          return null;
        }

        // Get locks from hodler
        const locks = await hodler.getLocks(address.value);
        logger.info('Locked relays fetched', locks);

        return locks;
      } catch (error) {
        logger.error('Error fetching locked relays', error);
        return null;
      }
    },
    enabled: computed(() => !!address.value),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Check if a specific relay is locked
 */
export const useIsRelayLockedQuery = (
  address: Ref<string | undefined> | ComputedRef<string | undefined>,
  fingerprint: string
) => {
  const lockedRelaysQuery = useLockedRelaysQuery(address);

  return computed(() => {
    const locks = lockedRelaysQuery.data.value;
    if (!locks) return false;
    return locks[fingerprint] !== undefined;
  });
};

/**
 * Get locked relays count
 */
export const useLockedRelaysCountQuery = (
  address: Ref<string | undefined> | ComputedRef<string | undefined>,
  allRelays: any
) => {
  const lockedRelaysQuery = useLockedRelaysQuery(address);

  return computed(() => {
    const locks = lockedRelaysQuery.data.value;
    if (!locks || !allRelays) return 0;

    return allRelays.filter(
      (relay: any) => relay.active && locks[relay.fingerprint] !== undefined
    ).length;
  });
};
