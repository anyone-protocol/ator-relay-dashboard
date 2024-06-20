import type { RelayMeta } from '@/types/relay';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getRelaysInfo = async (fingerPrints: string[]) => {
  const metricStore = useMetricsStore();
  const relays = {} as Record<string, RelayMeta>;

  const latestRelays = metricStore.relays?.latest || [];

  for (const fingerPrint of fingerPrints) {
    try {
      // Find the relay with the matching fingerprint
      const relay = latestRelays.find(
        (r) => r.relay.fingerprint === fingerPrint
      )?.relay;
      if (relay) {
        relays[fingerPrint] = {
          running: relay.running,
          fingerprint: relay.fingerprint,
          nickname: relay.nickname,
          status: '',
          ator_address: relay.ator_address,
          consensus_weight: relay.consensus_weight.toString(),
          observed_bandwidth: relay.observed_bandwidth,
          consensus_weight_fraction: relay.consensus_weight_fraction,
        };
      } else {
        logger.error(`Relay with fingerprint ${fingerPrint} not found`);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return relays;
};
