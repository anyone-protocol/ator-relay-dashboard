import { mainnet, sepolia } from 'viem/chains';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { http } from '@wagmi/vue';

const projectId = '53a5b087ab4cb303a799325360098216';

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, sepolia];

export function createWagmiConfig(rpcUrl: string, phase: string) {
  // console.log('Wagmi Config Phase & url: ', phase, rpcUrl);

  const isLive = phase === 'live';
  const defaultChain = isLive ? mainnet : sepolia;
  const selectedNetworks: [AppKitNetwork, ...AppKitNetwork[]] = isLive
    ? [mainnet]
    : [sepolia];

  const transports = isLive
    ? {
        [mainnet.id]: http(rpcUrl),
      }
    : ({
        [mainnet.id]: http('https://eth-mainnet.public.blastapi.io'),
        [sepolia.id]: http(rpcUrl),
      } as any);

  const wagmiAdapter = new WagmiAdapter({
    networks: selectedNetworks,
    projectId,
    ssr: false,
    transports,
  });

  return {
    wagmiAdapter,
    defaultChain,
    config: wagmiAdapter.wagmiConfig,
  };
}
