import { mainnet, sepolia, hardhat } from 'viem/chains';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { http } from '@wagmi/vue';

const projectId = '53a5b087ab4cb303a799325360098216';

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  sepolia,
  hardhat,
];

export const networksLocal: [AppKitNetwork, ...AppKitNetwork[]] = [
  sepolia,
  hardhat,
];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
  transports: {
    [mainnet.id]: http('https://eth-mainnet.public.blastapi.io'),
    [sepolia.id]: http('https://ethereum-sepolia.rpc.subquery.network/public'),
  },
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
