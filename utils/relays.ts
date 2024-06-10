import type { RelayMeta } from '@/types/relay';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getRelaysInfo = async (fingerPrints: string[]) => {
  const relays = {} as Record<string, RelayMeta>;

  for (const fingerPrint of fingerPrints) {
    try {
      const data: RelayMeta = await $fetch(
        `https://api-live.dmz.ator.dev/relays/${fingerPrint}`
      );

      relays[fingerPrint] = {
        nickname: data.nickname,
        fingerprint: data.fingerprint,
        consensus_weight: data.consensus_weight,
        observed_bandwidth: data.observed_bandwidth,
        running: data.running,
        ator_address: data.ator_address,
        consensus_weight_fraction: data.consensus_weight_fraction,
      };
    } catch (e) {
      console.error(e);
    }
    await wait(500);
  }

  return relays;
};
