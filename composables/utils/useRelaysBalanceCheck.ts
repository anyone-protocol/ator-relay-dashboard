import { fetchHardwareStatus } from './useHardwareStatus';
import { type RelayRow, type RelayTabType } from '@/types/relay';
import BigNumber from 'bignumber.js';

type LokedRelaysType = Record<
  string,
  {
    amount: bigint;
    owner: string;
    unlockedAt: bigint;
  }
>;

export const calculateBalance = async (
  relays: RelayRow[],
  lockedRelays: LokedRelaysType,
  balance: bigint
) => {
  //   console.log('relays', relays);
  relays = filterUniqueRelays(relays);
  //   console.log('lockedRelays', lockedRelays);
  if (lockedRelays && relays.length) {
    // remove lockedRelays[relay.fingerprint] !== undefined; from verifiedRelays
    relays = relays.filter(
      (relay) => lockedRelays[relay.fingerprint] === undefined
    );
  }
  //   console.log('Filtered verifiedRelays after removing locked relays:', relays);

  // Fetch the cached data once
  const cache = useRelayCache();
  const cachedData = await cache.getRelayData();
  const hardwareStatusMap: Record<string, boolean> = {};
  // Check the cache for hardware verification
  if (cachedData && cachedData.verifiedHardware) {
    relays.forEach((relay) => {
      hardwareStatusMap[relay.fingerprint] =
        !!cachedData.verifiedHardware[relay.fingerprint];
    });
  } else {
    // If no cache data or hardware verification available, default to false
    relays.forEach((relay) => {
      hardwareStatusMap[relay.fingerprint] = false;
    });
  }
  // remove hardware from the list
  const relaysWithoutHardware = filterUniqueRelays(
    relays.filter((relay) => !hardwareStatusMap[relay.fingerprint])
  );
  const relaysLenght = relaysWithoutHardware.length;
  const balanceNeeded = new BigNumber(relaysLenght * 100);
  const balanceLeft = new BigNumber(balance.toString()).minus(balanceNeeded);
  console.log('balanceLeft', balanceLeft.toString());

  if (balanceLeft.isLessThan(0)) {
    return false;
  }
  return true;
};

const filterUniqueRelays = (relays: RelayRow[]) => {
  const seen = new Set();

  return relays.filter((relay) => {
    const duplicate = seen.has(relay.fingerprint);
    seen.add(relay.fingerprint);
    return !duplicate;
  });
};
