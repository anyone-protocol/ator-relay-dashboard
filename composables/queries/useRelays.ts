import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { Ref } from 'vue';
import { useOperatorRegistry } from '../operator-registry';
import { useRuntimeConfig } from '#app';

export const useRelays = (address: Ref<string | undefined>) => {
  const operatorRegistry = useOperatorRegistry();

  return useQuery({
    queryKey: computed(() => ['relays', address.value]),
    queryFn: async () => {
      if (!address.value) return null;

      return await operatorRegistry.getRelayInfoForAddress(address.value);
    },
    enabled: computed(() => !!address.value),
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
