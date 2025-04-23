import { ContractUnknownEventPayload, EventLog } from 'ethers';
import { defineStore } from 'pinia';
import BigNumber from 'bignumber.js';

import { useUserStore } from '@/stores/useUserStore';
import type { ClaimProcess, FacilitatorStoreState } from '@/types/facilitator';
import { saveRedeemProcessSessionStorage } from '@/utils/redeemSessionStorage';
import Logger from '~/utils/logger';
import type { ClaimData, HolderStoreState, Lock, Vault } from '~/types/hodler';

const logger = new Logger('HodlerStore');

export const useHolderStore = defineStore('hodler', {
  state: (): HolderStoreState => {
    return {
      vaults: [],
      locks: {},
      lockSize: null,
      loading: false,
      lockedTokens: 0n,
      claimData: {
        totalClaimable: '0',
        totalClaimed: '0',
      },
      initialized: false,
      calculatedAirdrop: '0',
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
    isRelayOwner: (
      state
    ): ((fingerprint: string, address: string) => boolean) => {
      return (fingerprint: string, address: string): boolean => {
        return state.locks[fingerprint]?.operator === address;
      };
    },
  },
  actions: {
    setLoading(loading: boolean) {
      this.loading = loading;
    },
    setInitialized(initialized: boolean) {
      this.initialized = initialized;
    },
    setVaults(vaults: Vault[]) {
      this.vaults = vaults;
    },
    setLocks(locks: Record<string, Lock>) {
      this.locks = locks;
    },
    setLockSize(lockSize: bigint | null) {
      this.lockSize = lockSize;
    },
    setLockedTokens(lockedTokens: bigint) {
      this.lockedTokens = lockedTokens;
    },
    setClaimData(claimData: ClaimData) {
      this.claimData = claimData;
    },
  },
});
