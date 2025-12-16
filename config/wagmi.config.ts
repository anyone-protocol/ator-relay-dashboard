import { mainnet, sepolia, hardhat } from 'viem/chains';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { http } from '@wagmi/vue';

const projectId = '53a5b087ab4cb303a799325360098216';

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, sepolia];

export const networksLocal: [AppKitNetwork, ...AppKitNetwork[]] = [
  sepolia,
  hardhat,
];

const getDefaultChainAndTransport = () => {
  const config = useRuntimeConfig();

  if (config.public.phase === 'live') {
    return {
      defaultChain: mainnet,
      transports: {
        [mainnet.id]: http(config.public.evmRpc as string),
        [sepolia.id]: http(
          'https://ethereum-sepolia.rpc.subquery.network/public'
        ),
      },
    };
  }

  return {
    defaultChain: sepolia,
    transports: {
      [mainnet.id]: http('https://eth-mainnet.public.blastapi.io'),
      [sepolia.id]: http(config.public.evmRpc as string),
    },
  };
};

const { defaultChain, transports } = getDefaultChainAndTransport();
export { defaultChain };

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
  transports,
});

export const mainNetConfig = new WagmiAdapter({
  chains: [mainnet],
  networks: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  projectId,
  ssr: false,
});

export const config = wagmiAdapter.wagmiConfig;
