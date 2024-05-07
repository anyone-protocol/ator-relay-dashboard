import { AbstractProvider, BrowserProvider } from 'ethers'

export const useSigner = async () => {
  let provider = useProvider()

  if (provider instanceof AbstractProvider) {
    provider = initializeBrowserProvider()
  }

  if (provider instanceof BrowserProvider) {
    try {
      const signer = await provider.getSigner()
      if (provider._network.name !== NETWORKS.GOERLI.name) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{
            chainId: NETWORKS.GOERLI.hex
          }]
        })
      }

      return signer
    } catch (error) {
      console.error('Error getting Signer', error)
    }
  }

  return null
}
