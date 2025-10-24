import { useQuery } from '@tanstack/vue-query';
import type { RelayMeta } from '~/types/relay';

// composables/queries/useRelayMetricsQuery.ts
export const useRelayMetrics = (fingerprints: Ref<string[]>) => {
  const config = useRuntimeConfig();

  return useQuery({
    queryKey: ['relayMetrics', fingerprints],
    queryFn: async () => {
      if (fingerprints.value.length === 0) return {};

      const endpoint =
        config.public.centralizedMetricsAPI +
        '/relays?fingerprints=' +
        fingerprints.value.join(',');

      const response = await fetch(endpoint);

      if (response.status === 404 || response.status === 204) {
        return {};
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform to Record<fingerprint, metadata>
      const metricsMap: Record<string, RelayMeta> = {};
      data.forEach((metric: any) => {
        metricsMap[metric.fingerprint] = {
          fingerprint: metric.fingerprint,
          nickname: metric.nickname,
          anon_address: '', // Not provided by API
          consensus_weight: metric.consensus_weight.toString(),
          observed_bandwidth: metric.observed_bandwidth,
          consensus_weight_fraction: 0,
          running: metric.running,
        };
      });

      return metricsMap;
    },
    enabled: computed(() => fingerprints.value.length > 0),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
};
