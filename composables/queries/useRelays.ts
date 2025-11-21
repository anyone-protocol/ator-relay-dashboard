import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { Ref } from 'vue';
import { useOperatorRegistry } from '../operator-registry';
import { useHyperbeamFlag } from '../useHyperbeamFlag';
import { useRuntimeConfig } from '#app';

export const useRelays = (address: Ref<string | undefined>) => {
  const operatorRegistry = useOperatorRegistry();
  const { hyperbeamEnabled } = useHyperbeamFlag();
  const isHyperbeamEnabled = computed(() => hyperbeamEnabled.value);

  const unflattenRelayInfo = (flatData: Record<string, boolean>) => {
    const result = {
      claimable: [] as string[],
      verified: [] as string[],
      registrationCredits: [] as string[],
      verifiedHardware: [] as string[],
    };

    for (const [key] of Object.entries(flatData)) {
      if (key.startsWith('claimable_')) {
        result.claimable.push(key.replace('claimable_', ''));
      } else if (key.startsWith('verified_')) {
        result.verified.push(key.replace('verified_', ''));
      } else if (key.startsWith('registrationCredits_')) {
        result.registrationCredits.push(
          key.replace('registrationCredits_', '')
        );
      } else if (key.startsWith('verifiedHardware_')) {
        result.verifiedHardware.push(key.replace('verifiedHardware_', ''));
      }
    }

    return result;
  };

  const fetchRelaysViaHyperbeam = async (operatorAddress: string) => {
    const runtimeConfig = useRuntimeConfig();
    const processId = runtimeConfig.public.operatorRegistryHyperbeamProcessId;
    const scriptTxId = runtimeConfig.public.operatorDynamicViews;
    const hyperbeamUrl = runtimeConfig.public.hyperbeamUrl;
    const url = `${hyperbeamUrl}/${processId}~process@1.0/now/~lua@5.3a&module=${scriptTxId}/get_relay_info_for_address/serialize~json@1.0?operator=${`0x${operatorAddress.slice(2).toUpperCase()}` as `0x${string}`}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch relay info: ${response.statusText}`);
    }

    const flatData = await response.json();
    // console.log('getRelayInfoFlatData: ', flatData);
    const data = unflattenRelayInfo(flatData);
    console.log('getRelayInfoData: ', data);
    return data;
  };

  return useQuery({
    queryKey: computed(() => [
      'relays',
      address.value,
      isHyperbeamEnabled.value,
    ]),
    queryFn: async () => {
      if (!address.value) return null;

      if (isHyperbeamEnabled.value) {
        return await fetchRelaysViaHyperbeam(address.value);
      }

      return await operatorRegistry.getRelayInfoForAddress(address.value);
    },
    enabled: computed(() => !!address.value),
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
