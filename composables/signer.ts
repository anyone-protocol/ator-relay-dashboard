import { AbstractProvider, BrowserProvider } from 'ethers';
import Logger from '~/utils/logger';

const logger = new Logger('Signer');

const getTargetChainInfo = () => {
  const config = useRuntimeConfig();
  const phase = config.public.phase;

  if (phase === 'live') {
    return {
      name: NETWORKS.MAINNET.name,
      hex: NETWORKS.MAINNET.hex,
    };
  }

  return {
    name: NETWORKS.SEPOLIA.name,
    hex: NETWORKS.SEPOLIA.hex,
  };
};

export const useSigner = async () => {
  let provider = useProvider();

  if (provider instanceof AbstractProvider) {
    provider = initializeBrowserProvider();
  }

  if (provider instanceof BrowserProvider) {
    try {
      const signer = await provider.getSigner();
      const targetChain = getTargetChainInfo();
      if (provider._network.name !== targetChain.name) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [
            {
              chainId: targetChain.hex,
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
