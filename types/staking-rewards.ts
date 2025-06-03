export interface GetRewardsResponse {
  Rewarded: Record<string, string>;
  Claimed: Record<string, string>;
}

export interface OperatorRewards {
  operator: string;
  redeemable: string;
}

export interface StakingSnapshot {
  Network: Network;
  Stakes: Stakes;
  Timestamp: number;
}

interface Network {
  [address: `0x${string}`]: {
    expected: number;
    running: number;
    found: number;
  };
}

interface Stakes {
  [address: `0x${string}`]: string;
}
