import type BigNumber from 'bignumber.js';

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

export type DistributionPerRelay = Record<string, BigNumber>;
export type BonusesPerRelay = Record<
  string,
  {
    hardware: BigNumber;
    quality: BigNumber;
  }
>;

export type MultipliersPerRelay = Record<
  string,
  {
    family: string;
    region: string;
  }
>;

export interface FacilitatorStoreState {
  claims: ClaimProcess[];
  pendingClaim: ClaimProcess | null;
  totalClaimedTokens: string | null;
  alocatedTokens: string | null;
  distributionRefreshing: boolean;
  distributionRatePerDay: string;
  sumOfTotalDistributions: string;
  distributionPerRelay: DistributionPerRelay;
  bonusesPerRelay: BonusesPerRelay;
  multipliersPerRelay: MultipliersPerRelay;
  scorePerRelay: Record<string, BigNumber>;
  baseTokensPerRelay: DistributionPerRelay;
  previousDistributions: PreviousDistribution[];
  claimableAtomicTokens?: string;
  airDropTokens?: string;
  lastDistributionTimePerRelay: Record<string, string | null>;
  availableBudget?: string;
  usedBudget?: string;
  initialized: boolean;
}
