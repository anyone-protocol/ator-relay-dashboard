interface Domain {
  tokenId: string;
  name: string;
  owner: string | undefined;
  tld: string;
}

interface Operator {
  operator: `0x${string}`;
  amount: bigint;
  redeemableRewards?: string;
  total?: bigint;
  running?: boolean;
  domains?: Domain[];
}

/**
 * Filters operators by search query matching operator address or domain names
 * @param operators - Array of operators to filter
 * @param searchQuery - Search string to match against (case-insensitive)
 * @returns Filtered array of operators
 */
export function filterOperatorsByQuery(
  operators: Operator[],
  searchQuery: string
): Operator[] {
  if (!searchQuery) return operators;

  const query = searchQuery.toLowerCase();

  return operators.filter((op) => {
    // Check operator address
    const addressMatch = op.operator.toLowerCase().includes(query);

    // Check domain names
    const domainMatch =
      op.domains?.some((domain) => domain.name.toLowerCase().includes(query)) ||
      false;

    return addressMatch || domainMatch;
  });
}
