import { ContractUnknownEventPayload, EventLog } from 'ethers';
import { defineStore } from 'pinia';
import BigNumber from 'bignumber.js';

import { useUserStore } from '@/stores/useUserStore';
import type { ClaimProcess, FacilitatorStoreState } from '@/types/facilitator';
import { saveRedeemProcessSessionStorage } from '@/utils/redeemSessionStorage';

export const useFacilitatorStore = defineStore('facilitator', {
  state: (): FacilitatorStoreState => {
    return {
      claims: [],
      pendingClaim: null,
      totalClaimedTokens: null,
      alocatedTokens: null,
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
    hasClaimableRewards: (state) =>
      state.alocatedTokens && +state.alocatedTokens > 0,
    nextClaimNumber: (state) => state.claims.length + 1,
    hasPendingClaim: (state) => !!state.pendingClaim,
  },
  actions: {
    addPendingClaim(transactionHash: string, blockTimestamp: number) {
      const userStore = useUserStore();

      console.info('addPendingClaim()', transactionHash, blockTimestamp);
      if (this.pendingClaim) {
        console.info('addPendingClaim() duplicate claim', this.pendingClaim);
      } else {
        const timestamp = new Date(blockTimestamp * 1000).toUTCString();
        const claim = {
          claimNumber: this.nextClaimNumber,
          requestingUpdateTransactionHash: transactionHash,
          requestingUpdateBlockTimestamp: timestamp,
        };
        console.info('addPendingClaim() new claim', claim);
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

    async onAllocationUpdated(
      amount: bigint,
      allocationClaimed: ContractUnknownEventPayload
    ) {},

    async onAllocationClaimed(
      amount: bigint,
      allocationClaimed: ContractUnknownEventPayload
    ) {
      const toast = useToast();

      console.info('onAllocationClaimed()', amount);
      console.info('onAllocationClaimed() pending claim', this.pendingClaim);
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
          .dividedBy(1e18)
          .toFormat(3);

        console.info(
          'onAllocationClaimed() pending claim finalized',
          pendingClaimCopy
        );

        toast.add({
          icon: 'i-heroicons-check-circle',
          color: 'primary',
          title: 'Success',
          description: `Rewards redeemed successfully. You've redeemed ${pendingClaimCopy.amount} SATOR.`,
          actions: [
            {
              label: 'View transaction',
              click: () => {
                window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank');
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
