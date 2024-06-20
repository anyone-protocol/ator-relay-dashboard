import { AbstractProvider, BrowserProvider } from 'ethers';
import Logger from '~/utils/logger';
const logger = new Logger('Signer');

export const useSigner = async () => {
  let provider = useProvider();

  if (provider instanceof AbstractProvider) {
    provider = initializeBrowserProvider();
  }

  if (provider instanceof BrowserProvider) {
    try {
      const signer = await provider.getSigner();
      if (provider._network.name !== NETWORKS.SEPOLIA.name) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [
            {
              chainId: NETWORKS.SEPOLIA.hex,
            },
          ],
        });
      }
      return signer;
    } catch (error) {
      logger.error('Error getting Signer', error);
    }
  }

  return null;
};
