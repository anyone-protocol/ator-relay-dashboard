import { fetchHardwareStatus } from './useHardwareStatus';
import { type RelayRow, type RelayTabType } from '@/types/relay';
import BigNumber from 'bignumber.js';
import { getAnonAddressMain } from '~/config/web3modal.config';
import { getBalance } from '@wagmi/core';
import { config } from '@/config/wagmi.config';
import { mainnet } from 'viem/chains';
import { ethers } from 'ethers';

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
  address: `0x${string}`
) => {
  const token = getAnonAddressMain() as `0x${string}`;

  const tokenBalance = await getBalance(config, {
    chainId: mainnet.id,
    token,
    address,
  });
  if (!tokenBalance) {
    return false;
  }

  const balance = ethers.formatUnits(tokenBalance.value, 18);

  //   console.log('relays', relays);
  relays = filterUniqueRelays(relays);

  // filter remove status verified
  relays = relays.filter((relay) => relay.status === 'verified');

  //   console.log('Filtered verifiedRelays after removing locked relays:', relays);
  console.log('balance', balance.toString());
  // Fetch the cached data once
  const cache = useRelayCache();
  const cachedData = await cache.getRelayData();
  const hardwareStatusMap: Record<string, boolean> = {};
  // Check the cache for hardware verification
  if (cachedData && cachedData.verifiedHardware) {
    relays.forEach((relay) => {
      hardwareStatusMap[relay.fingerprint] =
        cachedData.verifiedHardware.includes(relay.fingerprint);
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
