import type { BundleItem } from './BundleItem';
import type Arweave from 'arweave';
import type { JWKInterface } from 'arweave/node/lib/wallet';
import type { CreateTransactionInterface, Transaction } from './utils';

type ResolvesTo<T> = T | Promise<T> | ((...args: any[]) => Promise<T>);

export interface BundleInterface {
  readonly length: ResolvesTo<number>;
  readonly items: BundleItem[] | AsyncGenerator<BundleItem>;
  get(index: number | string): BundleItem | Promise<BundleItem>;
  getIds(): string[] | Promise<string[]>;
  getRaw(): ResolvesTo<Buffer>;
  toTransaction(
    attributes: Partial<CreateTransactionInterface>,
    arweave: Arweave,
    jwk: JWKInterface
  ): Promise<Transaction>;
}
