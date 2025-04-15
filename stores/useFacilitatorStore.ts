import { ContractUnknownEventPayload, EventLog } from 'ethers';
import { defineStore } from 'pinia';
import BigNumber from 'bignumber.js';

import { useUserStore } from '@/stores/useUserStore';
import type { ClaimProcess, FacilitatorStoreState } from '@/types/facilitator';
import { saveRedeemProcessSessionStorage } from '@/utils/redeemSessionStorage';
import Logger from '~/utils/logger';

const logger = new Logger('FacilitatorStore');

export const useFacilitatorStore = defineStore('facilitator', {
  state: (): FacilitatorStoreState => {
    return {
      claims: [],
      pendingClaim: null,
      totalClaimedTokens: null,
      alocatedTokens: null,
      distributionRefreshing: false,
      distributionRatePerDay: '',
      sumOfTotalDistributions: '',
      previousDistributions: [],
      claimableAtomicTokens: '',
      airDropTokens: '',
      calculatedAirdrop: '',
      distributionPerRelay: {},
      bonusesPerRelay: {},
      multipliersPerRelay: {},
      scorePerRelay: {},
      baseTokensPerRelay: {},
      lastDistributionTimePerRelay: {},
      exitBonusPerRelay: {},
      initialized: false,
    };
  },
  getters: {
    claimLog: (state) => {
      if (state.pendingClaim) {
        return [state.pendingClaim, ...state.claims];
      } else {
        return state.claims;
      }
    },
    hasClaimableRewards: (state) => {
      if (state.claimableAtomicTokens) {
        if (state.totalClaimedTokens) {
          return BigNumber(state.claimableAtomicTokens)
            .minus(state.totalClaimedTokens)
            .isGreaterThan(0);
        }
        return BigNumber(state.claimableAtomicTokens).isGreaterThan(0);
      }
      return false;
    },
    setInitialized: (state) => (initialized: boolean) => {
      state.initialized = initialized;
    },
    availableAllocatedTokens: (state) => {
      if (state.claimableAtomicTokens) {
        if (state.totalClaimedTokens) {
          const allocatedTokens = BigNumber(state.claimableAtomicTokens).minus(
            BigNumber(state.totalClaimedTokens)
          );

          console.log('allocatedTokens', allocatedTokens);
          console.log('claimableAtomicTokens', state.claimableAtomicTokens);
          console.log('totalClaimedTokens', state.totalClaimedTokens);

          // Ensure that the value is never negative
          return allocatedTokens.isNegative()
            ? BigInt(0)
            : BigInt(allocatedTokens.toFixed(0));
        }
        return BigInt(state.claimableAtomicTokens);
        // return state.claimableAtomicTokens;
      }
      return BigInt(0);
      // return '0';
    },
    availableAirdropTokens: (state) => {
      if (state.airDropTokens) {
        return state.airDropTokens;
      }
      return '0';
    },
    nextClaimNumber: (state) => state.claims.length + 1,
    hasPendingClaim: (state) => !!state.pendingClaim,
  },
  actions: {
    addPendingClaim(transactionHash: string, blockTimestamp: number) {
      const userStore = useUserStore();

      logger.info('addPendingClaim()', transactionHash, blockTimestamp);
      if (this.pendingClaim) {
        logger.info('addPendingClaim() duplicate claim', this.pendingClaim);
      } else {
        const timestamp = new Date(blockTimestamp * 1000).toUTCString();
        const claim = {
          claimNumber: this.nextClaimNumber,
          requestingUpdateTransactionHash: transactionHash,
          requestingUpdateBlockTimestamp: timestamp,
        };
        logger.info('addPendingClaim() new claim', claim);
        this.pendingClaim = claim;

        // Save  pendingClaim to local storage
        if (userStore.userData.address) {
          saveRedeemProcessSessionStorage(
            userStore.userData.address,
            this.pendingClaim
          );
        }
      }
    },
    resetPendingClaim() {
      const userStore = useUserStore();

      logger.info('resetPendingClaim()');
      this.pendingClaim = null;

      // Save  pendingClaim to local storage
      if (userStore.userData.address) {
        resetPendingClaimSessionStorage(userStore.userData.address);
      }
    },

    async onAllocationUpdated(
      amount: bigint,
      allocationClaimed: ContractUnknownEventPayload
    ) {},

    async onAllocationClaimed(
      amount: bigint,
      allocationClaimed: ContractUnknownEventPayload
    ) {
      const toast = useToast();

      logger.info('onAllocationClaimed()', amount.toString());
      logger.info('onAllocationClaimed() pending claim', this.pendingClaim);
      if (!this.pendingClaim) {
        return;
      }

      if (
        this.pendingClaim &&
        !this.pendingClaim.allocationClaimedTransactionHash
      ) {
        const block = await allocationClaimed.getBlock();
        const tx = await allocationClaimed.getTransaction();

        const timestamp = new Date(block.timestamp * 1000).toUTCString();
        const pendingClaimCopy = JSON.parse(
          JSON.stringify(this.pendingClaim)
        ) as ClaimProcess;
        pendingClaimCopy.allocationClaimedTransactionHash =
          allocationClaimed.log.transactionHash;
        pendingClaimCopy.allocationClaimedBlockTimestamp = timestamp;
        pendingClaimCopy.amount = BigNumber(amount.toString())
          .dividedBy(Math.pow(10, 18))
          .toFormat(3);

        logger.info(
          'onAllocationClaimed() pending claim finalized',
          pendingClaimCopy
        );

        toast.add({
          icon: 'i-heroicons-check-circle',
          color: 'primary',
          title: 'Success',
          description: `Rewards redeemed successfully. You've redeemed ${pendingClaimCopy.amount} $ANYONE.`,
          actions: [
            {
              label: 'View transaction',
              click: () => {
                window.open(
                  `https://sepolia.etherscan.io/tx/${tx.hash}`,
                  '_blank'
                );
              },
            },
          ],
        });

        this.claims.push(pendingClaimCopy);
        this.pendingClaim = null;
      }
    },
  },
});
