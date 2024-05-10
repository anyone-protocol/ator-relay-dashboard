import {
  AbstractProvider,
  BrowserProvider,
  JsonRpcSigner,
  ethers
} from 'ethers'
import { InjectedEthereumSigner } from 'warp-contracts-plugin-deploy'
import { Buffer } from 'buffer'

/* @ts-expect-error types */
export class WarpSigner extends InjectedEthereumSigner {
  /* @ts-expect-error types */
  private signer: JsonRpcSigner

  async setSigner(signer?: JsonRpcSigner) {
    if (signer) {
      this.signer = signer
    } else {
      this.signer = await (this.signer as unknown as Promise<JsonRpcSigner>)
    }
  }

  async getAddress() {
    return await this.signer.getAddress()
  }

  async setPublicKey() {
    const message =
      'Please sign this message to authenticate with the ATOR dashboard.  '
      + 'You will only need to do this once per session when interacting with '
      + 'the Relay Registry.'
    const signed = await this.signer.signMessage(message)
    const hash = ethers.hashMessage(message)
    const recoveredPublicKey = ethers
      .SigningKey
      .recoverPublicKey(ethers.getBytes(hash), signed)
    this.publicKey = Buffer.from(ethers.getBytes(recoveredPublicKey))
  }
}


let warpSigner: WarpSigner | null = null

export const useWarpSigner = async () => {
  if (warpSigner) { return warpSigner }

  let provider = useProvider()
  if (provider instanceof AbstractProvider) {
    provider = initializeBrowserProvider()
  }
  if (!(provider instanceof BrowserProvider)) {
    console.error('Provider is not instanceof BrowserProvider')
    return null
  }
  try {
    /* @ts-expect-error types */
    warpSigner = new WarpSigner(provider)
    await warpSigner.setSigner(await provider.getSigner())
    await warpSigner.setPublicKey()

    return warpSigner
  } catch (error) {
    console.error('Error creating warp signer', error)
    return null
  }
}
