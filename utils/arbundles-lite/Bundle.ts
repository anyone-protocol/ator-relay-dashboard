import base64url from 'base64url';
import { byteArrayToLong } from './utils';
import DataItem from './DataItem';
import type Arweave from 'arweave';
import type { BundleInterface } from './BundleInterface';
import type { JWKInterface } from 'arweave/node/lib/wallet';
import { createHash } from 'crypto';
import type { CreateTransactionInterface, Transaction } from './utils';

const HEADER_START = 32;

export class Bundle implements BundleInterface {
  public length: number;
  public items: DataItem[];
  protected binary: Buffer;

  constructor(binary: Buffer) {
    this.binary = binary;
    this.length = this.getDataItemCount();
    this.items = this.getItems();
  }

  public getRaw(): Buffer {
    return this.binary;
  }

  /**
   * Get a DataItem by index (`number`) or by txId (`string`)
   * @param index
   */
  public get(index: number | string): DataItem {
    if (typeof index === 'number') {
      if (index >= this.length) {
        throw new RangeError('Index out of range');
      }

      return this.getByIndex(index);
    } else {
      return this.getById(index);
    }
  }

  public getSizes(): number[] {
    const ids: number[] = [];
    for (let i = HEADER_START; i < HEADER_START + 64 * this.length; i += 64) {
      ids.push(byteArrayToLong(this.binary.subarray(i, i + 32)));
    }

    return ids;
  }

  public getIds(): string[] {
    const ids: string[] = [];
    for (let i = HEADER_START; i < HEADER_START + 64 * this.length; i += 64) {
      const bundleId = this.binary.subarray(i + 32, i + 64);
      if (bundleId.length === 0) {
        throw new Error(
          "Invalid bundle, id specified in headers doesn't exist"
        );
      }
      ids.push(base64url.encode(bundleId));
    }

    return ids;
  }

  public getIdBy(index: number): string {
    if (index > this.length - 1) {
      throw new RangeError('Index of bundle out of range');
    }

    const start = 64 + 64 * index;
    return base64url.encode(this.binary.subarray(start, start + 32));
  }

  public async toTransaction(
    attributes: Partial<Omit<CreateTransactionInterface, 'data'>>,
    arweave: Arweave,
    jwk: JWKInterface
  ): Promise<Transaction> {
    const tx = await arweave.createTransaction(
      { data: this.binary, ...attributes },
      jwk
    );
    tx.addTag('Bundle-Format', 'binary');
    tx.addTag('Bundle-Version', '2.0.0');
    return tx;
  }

  public async verify(): Promise<boolean> {
    for (const item of this.items) {
      const valid = await item.isValid();
      const expected = base64url(
        createHash('sha256').update(item.rawSignature).digest()
      );
      if (!(valid && item.id === expected)) {
        return false;
      }
    }

    return true;
  }

  private getOffset(id: Uint8Array): { startOffset: number; size: number } {
    let offset = 0;
    for (let i = HEADER_START; i < HEADER_START + 64 * this.length; i += 64) {
      const _offset = byteArrayToLong(this.binary.subarray(i, i + 32));
      offset += _offset;
      const _id = this.binary.subarray(i + 32, i + 64);

      if (Buffer.compare(_id, id) === 0) {
        return { startOffset: offset, size: _offset };
      }
    }

    return { startOffset: -1, size: -1 };
  }

  // TODO: Test this
  /**
   * UNSAFE! Assumes index < length
   * @param index
   * @private
   */
  private getByIndex(index: number): DataItem {
    let offset = 0;
    const bundleStart = this.getBundleStart();
    let counter = 0;
    let _offset, _id;
    for (let i = HEADER_START; i < HEADER_START + 64 * this.length; i += 64) {
      _offset = byteArrayToLong(this.binary.subarray(i, i + 32));
      if (counter++ === index) {
        _id = this.binary.subarray(i + 32, i + 64);
        break;
      }
      offset += _offset;
    }
    const dataItemStart = bundleStart + offset;
    const slice = this.binary.subarray(dataItemStart, dataItemStart + _offset);
    const item = new DataItem(slice);
    item.rawId = _id;
    return item;
  }

  private getById(id: string): DataItem {
    const _id = base64url.toBuffer(id);

    const offset = this.getOffset(_id);
    if (offset.startOffset === -1) {
      throw new Error('Transaction not found');
    }

    const bundleStart = this.getBundleStart();
    const dataItemStart = bundleStart + offset.startOffset;
    return new DataItem(
      this.binary.subarray(dataItemStart, dataItemStart + offset.size)
    );
  }

  private getDataItemCount(): number {
    return byteArrayToLong(this.binary.subarray(0, 32));
  }

  private getBundleStart(): number {
    return 32 + 64 * this.length;
  }

  private getItems(): DataItem[] {
    const items = new Array(this.length);
    let offset = 0;
    const bundleStart = this.getBundleStart();

    let counter = 0;
    for (let i = HEADER_START; i < HEADER_START + 64 * this.length; i += 64) {
      const _offset = byteArrayToLong(this.binary.subarray(i, i + 32));
      const _id = this.binary.subarray(i + 32, i + 64);
      if (_id.length === 0) {
        throw new Error(
          "Invalid bundle, id specified in headers doesn't exist"
        );
      }
      const dataItemStart = bundleStart + offset;
      const bytes = this.binary.subarray(
        dataItemStart,
        dataItemStart + _offset
      );

      offset += _offset;

      const item = new DataItem(bytes);
      item.rawId = _id;
      items[counter] = item;

      counter++;
    }
    return items;
  }
}
export default Bundle;
