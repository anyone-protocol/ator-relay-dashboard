export type LokedRelaysType = string[];

export interface RegistratorStoreState {
  lokedRelays: LokedRelaysType;
  currentLockSize: bigint | null;
}
