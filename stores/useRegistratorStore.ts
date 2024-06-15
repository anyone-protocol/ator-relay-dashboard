import { defineStore } from 'pinia';

import type { RegistratorStoreState } from '@/types/registrator';

export const useRegistratorStore = defineStore('registrator', {
  state: (): RegistratorStoreState => {
    return {
      lokedRelays: {},
      currentLockSize: null,
      totalLockedTokens: 0n,
    };
  },
  actions: {
    isRelayOwner(fingerprint: string, address: string) {
      return this.lokedRelays[fingerprint]?.owner === address;
    },
    isRelayLocked(fingerprint: string) {
      return this.lokedRelays[fingerprint] !== undefined;
    },
    getUnlockTime(fingerprint: string) {
      return this.lokedRelays[fingerprint]?.unlockedAt;
    },
  },
});
