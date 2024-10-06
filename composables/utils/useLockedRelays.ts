import { useRegistratorStore } from '@/stores/useRegistratorStore';
import { useRegistrator } from '@/composables/registrator';
import { type RelayRow } from '@/types/relay';

export const fetchLockedRelays = async (
  allRelays: RelayRow[],
  address: `0x${string}` | undefined
) => {
  if (!allRelays || !allRelays.length || !address) {
    return {};
  }
  const registratorStore = useRegistratorStore();

  const registrator = useRegistrator();
  if (registrator) {
    console.log('fetchLockedRelays..................');
    await registrator.getLokedRelaysTokens(address);

    const lockedRelays = registratorStore.lokedRelays;

    const lockedRelaysMap: Record<string, boolean> = {};

    for (const relay of allRelays) {
      const isLocked = lockedRelays[relay.fingerprint] !== undefined;
      lockedRelaysMap[relay.fingerprint] = isLocked;
    }
    console.log('lockedRelaysMap', lockedRelaysMap);

    return lockedRelaysMap;
  } else {
    return {};
  }
};
