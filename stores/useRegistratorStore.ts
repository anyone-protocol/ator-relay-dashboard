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
    lockRelay(fingerprint: string) {
      this.lokedRelays[fingerprint] = 10n;
    },
    isRelayLocked(fingerprint: string) {
      return this.lokedRelays[fingerprint] !== undefined;
    },
  },
});
