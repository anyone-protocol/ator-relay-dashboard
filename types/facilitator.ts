export interface ClaimProcess {
  claimNumber: number;
  amount?: string;
  requestingUpdateTransactionHash?: string;
  requestingUpdateBlockTimestamp?: string;
  allocationClaimedTransactionHash?: string;
  allocationClaimedBlockTimestamp?: string;
}

export type PreviousDistribution = {
  timestamp: string;
  date: Date;
  timeElapsed: string;
  timeElapsedHumanized: string;
  tokensDistributedPerDay: string;
  totalScore: string;
  totalDistributed: string;
  fromNowHumanized: string;
};

export interface FacilitatorStoreState {
  claims: ClaimProcess[];
  pendingClaim: ClaimProcess | null;
  totalClaimedTokens: string | null;
  alocatedTokens: string | null;
  distributionRefreshing: boolean;
  distributionRatePerDay: string;
  sumOfTotalDistributions: string;
  previousDistributions: PreviousDistribution[];
  claimableAtomicTokens?: string;
  availableBudget?: string;
  usedBudget?: string;
}
