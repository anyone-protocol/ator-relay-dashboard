import { AbstractProvider, BrowserProvider } from 'ethers';

export const useSigner = async () => {
  let provider = useProvider();

  if (provider instanceof AbstractProvider) {
    provider = initializeBrowserProvider();
  }

  if (provider instanceof BrowserProvider) {
    try {
      const signer = await provider.getSigner();
      // TODO: Uncomment this
      // if (provider._network.name !== NETWORKS.SEPOLIA.name) {
      //   await window.ethereum.request({
      //     method: 'wallet_switchEthereumChain',
      //     params: [
      //       {
      //         chainId: NETWORKS.SEPOLIA.hex,
      //       },
      //     ],
      //   });
      // }

      return signer;
    } catch (error) {
      console.error('Error getting Signer', error);
    }
  }

  return null;
};
