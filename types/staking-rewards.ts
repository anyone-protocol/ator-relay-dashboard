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

interface Details {
  [address: `0x${string}`]: {
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
}

interface Configuration {
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
