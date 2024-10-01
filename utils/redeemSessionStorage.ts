import type { ClaimProcess } from '~/types/facilitator';

export const saveRedeemProcessSessionStorage = async (
  address: string,
  pendingClaim: ClaimProcess | null
) => {
  const data =
    JSON.parse(sessionStorage.getItem('pendingClaim') || 'null') || {};

  sessionStorage.setItem(
    'pendingClaim',
    JSON.stringify({
      ...data,
      [address]: pendingClaim,
    })
  );
};

export const getRedeemProcessSessionStorage = (
  address?: string
): ClaimProcess | null => {
  if (!address) {
    return null;
  }

  const data =
    JSON.parse(sessionStorage.getItem('pendingClaim') || 'null') || {};

  return data?.[address] || null;
};

export const resetPendingClaimSessionStorage = (address: string) => {
  const data =
    JSON.parse(sessionStorage.getItem('pendingClaim') || 'null') || {};

  delete data[address];

  sessionStorage.setItem('pendingClaim', JSON.stringify(data));
};
