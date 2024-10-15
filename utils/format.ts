import ethers from 'ethers';
import BigNumber from 'bignumber.js';

export function formatEtherNoRound(value: string | bigint): string {
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
  const rounded = etherValue.toFixed(2);

  return rounded;
}

export function calculateAirdrop(
  totalClaimedTokens: string,
  airDropTokens: string
) {
  const totalClaimed = new BigNumber(totalClaimedTokens);
  const airDrop = new BigNumber(airDropTokens).multipliedBy(1e18);

  const total = airDrop.minus(totalClaimed).toString(10);
  // return 0 if the total is negative
  if (new BigNumber(total).isNegative()) {
    return '0';
  }

  return total;
}
