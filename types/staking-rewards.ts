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

export interface NetworkRunningCount {
  expected: number;
  running: number;
  found: number;
}

export interface Network {
  [address: `0x${string}`]: NetworkRunningCount;
}

export interface Stakes {
  [address: `0x${string}`]: string;
}

export interface LastRoundMetadata {
  Timestamp: number;
  Period: number;
  Summary: {
    Rewards: string;
    Ratings: string;
    Stakes: string;
  };
  Configuration: Configuration;
}

export interface StakingRewardsRewarded {
  [hodlerAddress: `0x${string}`]: {
    [operatorAddress: `0x${string}`]: string; // Hodler's score per operator stake
  };
}

export interface StakingRewardsState {
  Claimable: [];
  Configuration: {
    TokensPerSecond: string;
    Requirements: {
      Running: number;
    };
  };
  PreviousRound: Omit<LastRoundMetadata, 'Configuration'>;
  Rewarded: [];
  Shares: [];
}

export interface Details {
  [hodlerAddress: `0x${string}`]: {
    [operatorAddress: `0x${string}`]: {
      Rating: string;
      Reward: {
        Operator: string;
        Hodler: string;
      };
      Score: {
        Share: number;
        Staked: string;
        Restaked: string;
        Running: number;
      };
    };
  };
}

export interface Configuration {
  TokensPerSecond: string;
  Requirements: {
    Running: number;
  };
}

export interface LastSnapshot {
  Configuration: Configuration;
  Details: Details;
  Timestamp: number;
  Period: number;
  Summary: {
    Rewards: string;
    Ratings: string;
    Stakes: string;
  };
}
