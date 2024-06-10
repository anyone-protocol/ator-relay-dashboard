import {
  type ContractFunctionInput,
  type EvolvableState,
  type OwnableState,
} from '@/utils/contracts';

export type Score = {
  score: string;
  address: string;
  fingerprint: string;
};

export type DistributionState = OwnableState &
  EvolvableState & {
    tokensDistributedPerSecond: string;
    pendingDistributions: {
      [timestamp: string]: Score[];
    };
    claimable: {
      [address: string]: string;
    };
    previousDistributions: {
      [timestamp: string]: {
        totalScore: string;
        totalDistributed: string;
        timeElapsed: string;
        tokensDistributedPerSecond: string;
      };
    };
  };

export interface SetTokenDistributionRate extends ContractFunctionInput {
  function: 'setTokenDistributionRate';
  tokensDistributedPerSecond: string;
}

export interface AddScores extends ContractFunctionInput {
  function: 'addScores';
  timestamp: string;
  scores: Score[];
}

export interface Distribute extends ContractFunctionInput {
  function: 'distribute';
  timestamp: string;
}

export interface CancelDistribution extends ContractFunctionInput {
  function: 'cancelDistribution';
  timestamp: string;
}
