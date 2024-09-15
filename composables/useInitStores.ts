// composables/useInitStores.ts

import { useFacilitator } from '@/composables/facilitator';
import { useRegistrator } from '@/composables/registrator';
import { useDistribution } from '@/composables/distribution';
import { initRelayRegistry } from '@/composables/relay-registry';
import { initToken } from '@/composables/token';
import { initDistribution } from '@/composables/distribution';
import { initFacilitator } from '@/composables/facilitator';
import { useUserStore } from '@/stores/useUserStore';
import { useMetricsStore } from '@/stores/useMetricsStore';

export const initStores = async (
  newAddress: `0x${string}` | undefined,
  forceRefresh = false
) => {
  try {
    await initDistribution();
    await initFacilitator();
    if (forceRefresh) {
      await useFacilitator()?.refresh();
      await useRegistrator()?.refresh();
    }
    newAddress && (await useDistribution().claimable(newAddress));
    await useDistribution().refresh();
    await initRelayRegistry();
    await initToken();
    await useUserStore().getVerifiedRelays();
    await useMetricsStore().refreshRelayMetrics();

    return true;
  } catch (error) {
    console.error('Error initializing stores:', error);
    return false;
  }
};
