export abstract class Signer {
  readonly publicKey: Buffer;
  readonly signatureType: number;
  readonly signatureLength: number;
  readonly ownerLength: number;
  readonly pem?: string | Buffer;

  abstract sign(
    message: Uint8Array,
    _opts?: any
  ): Promise<Uint8Array> | Uint8Array;
  static verify(
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    _pk: string | Buffer,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    _message: Uint8Array,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    _signature: Uint8Array,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    _opts?: any
  ): boolean {
    throw new Error('You must implement verify method on child');
  }
}
