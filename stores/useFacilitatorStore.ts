import { ContractUnknownEventPayload, EventLog } from 'ethers';
import { defineStore } from 'pinia';
import BigNumber from 'bignumber.js';

import { useFacilitator } from '@/composables/facilitator';
import { useUserStore } from '@/stores/useUserStore';

interface ClaimProcess {
  claimNumber: number;
  amount?: string;
  requestingUpdateTransactionHash?: string;
  requestingUpdateBlockTimestamp?: string;
  allocationClaimedTransactionHash?: string;
  allocationClaimedBlockTimestamp?: string;
}

interface FacilitatorStoreState {
  claims: ClaimProcess[];
  pendingClaim: ClaimProcess | null;
  totalClaimedTokens: string | null;
  alocatedTokens: string | null;
}

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
    hasClaimableRewards: (state) => !!state.alocatedTokens,
    nextClaimNumber: (state) => state.claims.length + 1,
    hasPendingClaim: (state) => !!state.pendingClaim,
  },
  actions: {
    async queryEventsForAuthedUser() {
      const auth = useUserStore();
      const facilitator = useFacilitator();
      debugger;
      if (!facilitator) {
        return;
      }

      if (auth.userData?.address) {
        const { address } = auth.userData;

        console.info('queryEventsForAuthedUser', address);

        const requestingUpdate = await facilitator.refresh();
        const allocationClaimed = await facilitator.query(
          'AllocationClaimed',
          address
        );
        const combined: EventLog[] = [
          ...(requestingUpdate as EventLog[]),
          ...(allocationClaimed as EventLog[]),
        ];

        debugger;

        // NB: Sort combined event log by block and tx index ascending
        combined.sort((a, b) => {
          const aVal = parseFloat(`${a.blockNumber}.${a.transactionIndex}`);
          const bVal = parseFloat(`${b.blockNumber}.${b.transactionIndex}`);
          return aVal - bVal;
        });

        console.info('Got claim events for authed user', combined);

        const claims: ClaimProcess[] = [];
        let currentClaim: ClaimProcess = { claimNumber: claims.length + 1 };
        for (let i = 0; i < combined.length; i++) {
          const log = combined[i];
          const { eventName } = log;

          if (
            eventName === 'RequestingUpdate' &&
            !currentClaim.requestingUpdateTransactionHash
          ) {
            const block = await log.getBlock();
            const timestamp = new Date(block.timestamp * 1000).toUTCString();
            currentClaim.requestingUpdateTransactionHash = log.transactionHash;
            currentClaim.requestingUpdateBlockTimestamp = timestamp;
          } else if (
            eventName === 'AllocationClaimed' &&
            !currentClaim.allocationClaimedTransactionHash
          ) {
            const block = await log.getBlock();
            const timestamp = new Date(block.timestamp * 1000).toUTCString();
            const amount = log.args[1] as bigint;
            currentClaim.allocationClaimedTransactionHash = log.transactionHash;
            currentClaim.allocationClaimedBlockTimestamp = timestamp;
            currentClaim.amount = BigNumber(amount.toString())
              .dividedBy(1e18)
              .toFormat(3);
          }

          if (
            currentClaim.requestingUpdateTransactionHash &&
            currentClaim.allocationClaimedTransactionHash
          ) {
            // Add to finalized claims
            claims.push(currentClaim);
            // Reset claim loop window
            currentClaim = { claimNumber: claims.length + 1 };
          }
        }

        // NB: Check if last claim is pending, set copy as pending claim
        if (
          currentClaim.requestingUpdateTransactionHash &&
          !currentClaim.allocationClaimedTransactionHash
        ) {
          this.pendingClaim = JSON.parse(
            JSON.stringify(currentClaim)
          ) as ClaimProcess;
        }

        // NB: Reverse claims so they are in descending order
        claims.reverse();
        console.info('Got claims', claims);
        this.claims = claims;
      } else {
        this.$reset();
      }
    },

    addPendingClaim(transactionHash: string, blockTimestamp: number) {
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

        this.claims.push(pendingClaimCopy);
        this.pendingClaim = null;
      }
    },
  },
});
