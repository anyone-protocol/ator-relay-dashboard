import {
  AbstractProvider,
  BrowserProvider,
  JsonRpcSigner,
  ethers,
} from 'ethers';
import { InjectedEthereumSigner } from 'warp-contracts-plugin-deploy';
import { Buffer } from 'buffer';
import { createData } from 'arbundles';
import Arweave from 'arweave';
import getSignatureData from 'arbundles/build/web/esm/src/ar-data-base';

async function getSignatureAndId(
  item: DataItem,
  signer: WarpSigner
): Promise<{ signature: Buffer; id: Buffer }> {
  // @ts-expect-error we know the types are compatible
  const signatureData = await getSignatureData(item);
  const signatureBytes = await signer.sign(signatureData);
  const idBytes = await Arweave.crypto.hash(signatureBytes);

  return { signature: Buffer.from(signatureBytes), id: Buffer.from(idBytes) };
}

/* @ts-expect-error types */
export class WarpSigner extends InjectedEthereumSigner {
  /* @ts-expect-error types */
  private signer: JsonRpcSigner;

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
      'the Relay Registry.';

    const signed = await this.signer.signMessage(message);
    const hash = ethers.hashMessage(message);
    const recoveredPublicKey = ethers.SigningKey.recoverPublicKey(
      ethers.getBytes(hash),
      signed
    );
    this.publicKey = Buffer.from(ethers.getBytes(recoveredPublicKey));
  }

  async signDataItem({ data, tags, target, anchor }: DataItem) {
    const item = createData(data, this, { tags, target, anchor });
    const { signature } = await getSignatureAndId(item, this);
    item.getRaw().set(signature, 2);

    return item.getRaw();
  }
}

let warpSigner: WarpSigner | null = null;

export const useWarpSigner = async () => {
  if (warpSigner?.publicKey) {
    return warpSigner;
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
    warpSigner = new WarpSigner(provider);
    await warpSigner.setSigner(await provider.getSigner());
    await warpSigner.setPublicKey();

    return warpSigner;
  } catch (error) {
    return null;
  }
};
