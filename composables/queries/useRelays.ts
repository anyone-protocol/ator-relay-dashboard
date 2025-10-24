import { useQuery } from '@tanstack/vue-query';

export const useRelays = (address: Ref<string | undefined>) => {
  const operatorRegistry = useOperatorRegistry();

  return useQuery({
    queryKey: ['relays', address],
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
