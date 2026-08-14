import { getAddress } from 'ethers';

/**
 * Canonical EIP-55 form of an EVM address.
 *
 * Use this for EVERY address the dashboard compares, keys a map by, or looks up in contract
 * data. The native contracts store and return EIP-55 (`0x03d3A2b2…`), so canonical-vs-canonical
 * comparison just works and no re-keying of contract responses is needed.
 *
 * ⚠️ This replaces a `0x${addr.slice(2).toUpperCase()}` idiom that was correct against LEGACYNET,
 * which stored addresses ALLCAPS. Against the native contracts an upper-cased key silently MISSES
 * — e.g. `lastSnapshot.Details[hodler][operator]` returns undefined for every operator, so a
 * delegated-stake total reads 0 rather than failing. Comparisons that upper-cased BOTH sides kept
 * working by accident; indexing into contract data did not.
 *
 * Falls back to the input rather than throwing: `getAddress` rejects a mixed-case address whose
 * checksum is wrong AND an all-uppercase one, and a display helper must not take a page down.
 */
export const eip55 = (address?: string | null): string => {
  if (!address) return '';
  try {
    return getAddress(address);
  } catch {
    return address;
  }
};

/** True when two addresses are the same account, whatever case either arrived in. */
export const sameAddress = (a?: string | null, b?: string | null): boolean =>
  !!a && !!b && eip55(a) === eip55(b);
