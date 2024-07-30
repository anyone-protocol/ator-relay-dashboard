import { defineStore } from 'pinia';

import type { RegistratorStoreState } from '@/types/registrator';

export const useRegistratorStore = defineStore('registrator', {
  state: (): RegistratorStoreState => {
    return {
      lokedRelays: {},
      currentLockSize: null,
      totalLockedTokens: 0n,
      blockNumber: 10e8,
      loading: true,
    };
  },
  actions: {
    isRelayOwner(fingerprint: string, address: string) {
      return this.lokedRelays[fingerprint]?.owner === address;
    },
    isRelayLocked(fingerprint: string) {
      return this.lokedRelays[fingerprint] !== undefined;
    },
    isUnlockable(fingerprint: string) {
      return this.lokedRelays[fingerprint]?.unlockedAt < this.blockNumber;
    },
    getUnlockTime(fingerprint: string) {
      return this.lokedRelays[fingerprint]?.unlockedAt;
    },
    setLoading(loading: boolean) {
      this.loading = loading;
    },
  },
});
