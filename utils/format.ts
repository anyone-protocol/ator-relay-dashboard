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
