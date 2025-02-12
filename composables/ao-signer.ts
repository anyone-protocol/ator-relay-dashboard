import {
  AbstractProvider,
  BrowserProvider,
  getBytes,
  hashMessage,
  JsonRpcSigner,
  SigningKey,
} from 'ethers';

import { InjectedEthereumSigner } from '~/utils/arbundles-lite/signing/chains/injectedEthereumSigner';

export class AoSigner extends InjectedEthereumSigner {
  public declare signer: JsonRpcSigner;

  async setSigner(signer?: JsonRpcSigner) {
    if (signer) {
      this.signer = signer;
    } else {
      this.signer = await (this.signer as unknown as Promise<JsonRpcSigner>);
    }
  }

  async getAddress() {
    return await this.signer.getAddress();
  }

  override async setPublicKey() {
    let message =
      'Please sign this message to authenticate with the Anyone dashboard.  ' +
      'You will only need to do this once per session when interacting with ' +
      'the Operator Registry.';

    const signed = await this.signer.signMessage(message);
    const hash = hashMessage(message);
    const recoveredPublicKey = SigningKey.recoverPublicKey(
      getBytes(hash),
      signed
    );
    this.publicKey = Buffer.from(getBytes(recoveredPublicKey));
  }
}

let aoSigner: AoSigner | null = null;
export const useAoSigner = async () => {
  if (aoSigner?.publicKey) {
    return aoSigner;
  }

  let provider = useProvider();
  if (provider instanceof AbstractProvider) {
    provider = initializeBrowserProvider();
  }
  if (!(provider instanceof BrowserProvider)) {
    return null;
  }

  try {
    /* @ts-expect-error types */
    aoSigner = new AoSigner(provider);
    await aoSigner.setSigner(await provider.getSigner());
    await aoSigner.setPublicKey();

    return aoSigner;
  } catch (error) {
    return null;
  }
};
