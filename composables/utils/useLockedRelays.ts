// useLockedRelays.ts
import { ref } from 'vue';
import { useRegistratorStore } from '@/stores/useRegistratorStore';
import { useUserStore } from '@/stores/useUserStore';
import { type RelayRow, type RelayTabType } from '@/types/relay';

export const useLockedRelays = () => {
  const lockedRelays = ref<Record<string, boolean>>({});
  const registratorStore = useRegistratorStore();
  const userStore = useUserStore();

  const fetchLockedRelays = async (allRelays: RelayRow[]) => {
    const lockedRelaysMap: Record<string, boolean> = {};

    for (const relay of allRelays) {
      const isLocked = registratorStore.isRelayLocked(relay.fingerprint);
      lockedRelaysMap[relay.fingerprint] = isLocked;
    }

    lockedRelays.value = lockedRelaysMap;
  };

  return { lockedRelays, fetchLockedRelays };
};
