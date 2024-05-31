export interface ClaimProcess {
  claimNumber: number;
  amount?: string;
  requestingUpdateTransactionHash?: string;
  requestingUpdateBlockTimestamp?: string;
  allocationClaimedTransactionHash?: string;
  allocationClaimedBlockTimestamp?: string;
}

export interface FacilitatorStoreState {
  claims: ClaimProcess[];
  pendingClaim: ClaimProcess | null;
  totalClaimedTokens: string | null;
  alocatedTokens: string | null;
}
