import BigNumber from 'bignumber.js';
import type { Block } from 'viem';

export function formatEtherNoRound(
  value: string | bigint,
  decimals?: number
): string {
  // console.log('formatEtherNoRound', value);
  let bigNumberValue: BigNumber;

  try {
    if (typeof value === 'string') {
      // If the value is in scientific notation, convert it to a regular number string
      bigNumberValue = new BigNumber(value);
    } else {
      // Convert bigint to BigNumber
      bigNumberValue = new BigNumber(value.toString());
    }
  } catch (error) {
    throw new TypeError(`Invalid BigNumberish string: ${value}`);
  }

  // Convert the value to Ether units (18 decimal places)
  const etherValue = bigNumberValue.div(new BigNumber('1e18'));

  // Round the Ether value to 2 decimal places
  const rounded = etherValue.toFixed(decimals || 2, BigNumber.ROUND_DOWN);

  return rounded;
}

export function formatDecimal(value: string): string {
  // max 2 decimal places
  return new BigNumber(value).toFixed(2).toString();
}

export function calculateAirdrop(
  totalClaimedTokens: string,
  airDropTokens: string
) {
  const totalClaimed = new BigNumber(totalClaimedTokens);
  const airDrop = new BigNumber(airDropTokens).multipliedBy(Math.pow(10, 18));

  const total = totalClaimed.minus(airDrop).toString(10);
  // return 0 if the total is negative
  if (new BigNumber(total).isNegative()) {
    return '0';
  }

  return total;
}

export const formatAvailableAt = (availableAt: bigint, block: Block) => {
  const timestamp = block.timestamp;
  const timeDiffSeconds = availableAt - timestamp - BigInt(15 * 60);
  if (timeDiffSeconds <= 0n) return 'Expired';

  const secondsPerDay = BigInt(24 * 60 * 60);
  const secondsPerHour = BigInt(60 * 60);
  const secondsPerMinute = BigInt(60);

  const days = timeDiffSeconds / secondsPerDay;
  const hours = (timeDiffSeconds % secondsPerDay) / secondsPerHour;
  const minutes = (timeDiffSeconds % secondsPerHour) / secondsPerMinute;

  return `${days}D ${hours}H ${minutes}M`;
};
