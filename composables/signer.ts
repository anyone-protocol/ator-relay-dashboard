import { AbstractProvider, BrowserProvider, JsonRpcProvider } from 'ethers';

export const useSigner = async () => {
  let provider = useProvider();

  if (provider instanceof AbstractProvider) {
    provider = initializeBrowserProvider();
  }

  if (
    provider instanceof BrowserProvider ||
    provider instanceof JsonRpcProvider
  ) {
    try {
      const signer = await provider.getSigner();
      // TODO: Uncomment this
      // if (provider._network.name !== NETWORKS.SEPOLIA.name) {
      //   await window.ethereum.request({
      //     method: 'wallet_switchEthereumChain',
      //     params: [
      //       {
      //         chainId: NETWORKS.HARDHAT.hex,
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
