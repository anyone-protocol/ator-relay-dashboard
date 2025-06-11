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
  anon_address: string;
  consensus_weight: string;
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

export type RelayTabType = 'all' | 'claimable' | 'locked' | 'unlocked';

export type RelayData = {
  timestamp: number;
  data: {
    state: any;
    verifiedHardware: { [key: string]: Number };
    verified: [
      {
        address: string;
        fingerprint: string;
        status: string;
        active: boolean;
        class: string;
      },
    ];
    claimable: [
      {
        address: string;
        fingerprint: string;
        status: string;
        active: boolean;
        class: string;
      },
    ];
    nicknames: { [key: string]: string };
    registrationCredits: string[];
    registrationCreditsRequired: boolean;
    families: { [key: string]: string[] };
    familyRequired: boolean;
  };
};
