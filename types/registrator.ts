export type LokedRelaysType = Record<
  string,
  {
    amount: bigint;
    owner: string;
  }
>;

export interface RegistratorStoreState {
  lokedRelays: LokedRelaysType;
  currentLockSize: bigint | null;
  totalLockedTokens: bigint;
}

export type LokedRelaysResponse = Array<{
  0: bigint;
  1: bigint;
  2: string;
  3: string;
}>;
