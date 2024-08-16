import { formatEther } from 'ethers';

export function formatEtherNoRound(value: string | bigint): string {
  const formatted = formatEther(value);

  const decimalIndex = formatted.indexOf('.');

  if (decimalIndex === -1) {
    return formatted;
  }
  const beforeDecimal = formatted.substring(0, decimalIndex);
  const afterDecimal = formatted.substring(decimalIndex + 1);
  const truncatedAfterDecimal = afterDecimal.substring(0, 4);
  return beforeDecimal + '.' + truncatedAfterDecimal;
}
