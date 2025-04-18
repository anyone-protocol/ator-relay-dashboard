import { ContractUnknownEventPayload, EventLog } from 'ethers';
import { defineStore } from 'pinia';
import BigNumber from 'bignumber.js';

import { useUserStore } from '@/stores/useUserStore';
import type { ClaimProcess, FacilitatorStoreState } from '@/types/facilitator';
import { saveRedeemProcessSessionStorage } from '@/utils/redeemSessionStorage';
import Logger from '~/utils/logger';
import type { HolderStoreState, Vault } from '~/types/hodler';

const logger = new Logger('HodlerStore');

export const useHolderStore = defineStore('hodler', {
  state: (): HolderStoreState => {
    return {
      vaults: [],
      locks: {},
      lockSize: null,
    };
  },
  getters: {
    getExpiredVaults: (state): Vault[] => {
      return state.vaults.filter((vault) => vault.availableAt <= Date.now());
    },
    relayIsLocked:
      (state) =>
      (fingerprint: string): boolean => {
        return state.locks[fingerprint] !== undefined;
      },
  },
});
