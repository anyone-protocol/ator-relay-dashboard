// Once there is a transaction ID from the user store, fetch the relay meta
export type RelayMetricResult =
  | 'OK'
  | 'Failed'
  | 'NotRegistered'
  | 'AlreadyVerified';

export type RelayMeta = {
  running: boolean;
  fingerprint: string;
  nickname?: string;
  status?: string;
  ator_address: string;
  consensus_weight: number;
  observed_bandwidth: number;
  consensus_weight_fraction: number;
};

export type RelayMetric = {
  result: RelayMetricResult;
  relay: RelayMeta;
};

export type RelayRow = {
  fingerprint: string;
  status: string;
  consensusWeight: number;
  observedBandwidth: number;
  active: boolean;
  class?: string;
  isWorking?: boolean;
  nickname?: string;
};

export type RelayTabType = 'all' | 'claimable' | 'locked';
