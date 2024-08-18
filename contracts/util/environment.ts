import { ContractError } from 'warp-contracts';

export function ContractAssert(cond: boolean, message: any): asserts cond {
  if (!cond) {
    throw new ContractError(message);
  }
}

export const SmartWeave = {
  transaction: { id: '' },
  unsafeClient: {
    transactions: {
      async getData(txid: string) {
        return null;
      },
    },
  },
};
