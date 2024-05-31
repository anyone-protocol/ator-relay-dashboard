import type { ClaimProcess } from '~/types/facilitator';

export const saveRedeemProcessLocalStorage = async (
  address: string,
  pendingClaim: ClaimProcess | null
) => {
  const data = JSON.parse(localStorage.getItem('pendingClaim') || 'null') || {};

  localStorage.setItem(
    'pendingClaim',
    JSON.stringify({
      ...data,
      [address]: pendingClaim,
    })
  );
};

export const getRedeemProcessLocalStorage = (
  address?: string
): ClaimProcess | null => {
  if (!address) {
    return null;
  }

  const data = JSON.parse(localStorage.getItem('pendingClaim') || 'null') || {};

  return data?.[address] || null;
};
