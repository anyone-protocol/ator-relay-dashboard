import BigNumber from 'bignumber.js';

export function formatNumber(numStr: string): string {
  BigNumber.config({ EXPONENTIAL_AT: 1e9 }); // Set to higher value to avoid exponential notation

  const num = new BigNumber(numStr);

  if (num.isNaN()) {
    throw new Error('Invalid number format');
  }

  if (num.isZero()) return '0';

  const suffixes = [
    { value: new BigNumber('1e24'), symbol: 'Y' }, // Yotta
    { value: new BigNumber('1e21'), symbol: 'Z' }, // Zetta
    { value: new BigNumber('1e18'), symbol: 'E' }, // Exa
    { value: new BigNumber('1e15'), symbol: 'P' }, // Peta
    { value: new BigNumber('1e12'), symbol: 'T' }, // Tera
    { value: new BigNumber('1e9'), symbol: 'B' }, // Billion
    { value: new BigNumber('1e6'), symbol: 'M' }, // Million
    { value: new BigNumber('1e3'), symbol: 'K' }, // Thousand
  ];

  const sign = num.isNegative() ? -1 : 1;
  const absNum = num.abs();

  for (let i = 0; i < suffixes.length; i++) {
    if (absNum.isGreaterThanOrEqualTo(suffixes[i].value)) {
      const truncated = absNum.dividedBy(suffixes[i].value).toFixed(3);
      return truncated.endsWith('.000')
        ? truncated.slice(0, -4) + suffixes[i].symbol
        : truncated + suffixes[i].symbol;
    }
  }

  // Special case: If number is smaller than 0.0001, format as "0.01"
  if (absNum.isLessThan(0.0001)) {
    return '0.01';
  }

  // For very small numbers between 0.0001 and 1e-3, use scientific notation
  if (absNum.isLessThan(1e-3)) {
    const scientific = absNum.toExponential(3);
    return sign === -1 ? '-' + scientific : scientific;
  }

  // Default case: return the number with up to 3 decimal places
  const truncated = absNum.toFixed(3);
  return truncated.endsWith('.000') ? truncated.slice(0, -4) : truncated;
}
