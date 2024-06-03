import { defineStore } from 'pinia';

import type { RegistratorStoreState } from '@/types/registrator';

export const useRegistratorStore = defineStore('registrator', {
  state: (): RegistratorStoreState => {
    return {
      lokedRelays: [],
      currentLockSize: null,
    };
  },
  actions: {
    lockRelay(fingerprint: string) {
      this.lokedRelays.push(fingerprint);
    },
  },
});
