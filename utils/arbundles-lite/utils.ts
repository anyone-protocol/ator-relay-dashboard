export function longToNByteArray(N: number, long: number): Uint8Array {
  const byteArray = new Uint8Array(N);
  if (long < 0)
    throw new Error('Array is unsigned, cannot represent -ve numbers');
  if (long > 2 ** (N * 8) - 1)
    throw new Error(`Number ${long} is too large for an array of ${N} bytes`);
  for (let index = 0; index < byteArray.length; index++) {
    const byte = long & 0xff;
    byteArray[index] = byte;
    long = (long - byte) / 256;
  }
  return byteArray;
}

export function longTo8ByteArray(long: number): Uint8Array {
  return longToNByteArray(8, long);
}

export function shortTo2ByteArray(short: number): Uint8Array {
  return longToNByteArray(2, short);
}

export function longTo16ByteArray(long: number): Uint8Array {
  return longToNByteArray(16, long);
}

export function longTo32ByteArray(long: number): Uint8Array {
  return longToNByteArray(32, long);
}

export function byteArrayToLong(byteArray: Uint8Array): number {
  let value = 0;
  for (let i = byteArray.length - 1; i >= 0; i--) {
    value = value * 256 + byteArray[i];
  }
  return value;
}

import { createPublicKey } from 'crypto';
import { default as nodeDriver } from 'arweave/node/lib/crypto/node-driver';
import type { JWKInterface } from 'arweave/node/lib/wallet';
export { stringToBuffer, concatBuffers } from 'arweave/node/lib/utils';
export { default as Transaction } from 'arweave/node/lib/transaction';
export { deepHash } from './deepHash';
// export type { CreateTransactionInterface } from 'arweave/node'//"@irys/arweave/common/arweave";
export { default as Arweave } from 'arweave/node';
import { Tag } from 'arweave/node/lib/transaction';

export interface CreateTransactionInterface {
  format: number;
  last_tx: string;
  owner: string;
  tags: Tag[];
  target: string;
  quantity: string;
  data: string | Uint8Array | ArrayBuffer;
  data_size: string;
  data_root: string;
  reward: string;
}

// hack as ESM won't unpack .default CJS imports, so we do so dynamically

const driver: typeof nodeDriver = nodeDriver['default']
  ? nodeDriver['default']
  : nodeDriver;
export class CryptoDriver extends driver {
  public getPublicKey(jwk: JWKInterface): string {
    return createPublicKey({
      key: this.jwkToPem(jwk),
      type: 'pkcs1',
      format: 'pem',
    })
      .export({
        format: 'pem',
        type: 'pkcs1',
      })
      .toString();
  }
}

let driverInstance: CryptoDriver;
export function getCryptoDriver(): CryptoDriver {
  return (driverInstance ??= new CryptoDriver());
}
