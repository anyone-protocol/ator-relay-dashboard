import type BigNumber from 'bignumber.js';

export type Vault = {
  amount: string;
  availableAt: number;
  // 1 for unlocked
  // 2 for unstaked
  // 3 for removeVote
  kind: number;
  // resembles fingerprint for 1
  // resembles stake operator (own address) for 2
  // resembles nothing (empty) for 3
  data: string;
};

export type Lock = {
  fingerprint: string;
  operator: string;
  amount: string;
};

export type HolderStoreState = {
  vaults: Vault[];
  locks: Record<string, Lock>;
  lockSize: bigint | null;
};
