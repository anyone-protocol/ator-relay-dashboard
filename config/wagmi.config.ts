import { reconnect } from 'use-wagmi/actions';
import { http, createConfig } from 'use-wagmi';
import { mainnet, sepolia, hardhat } from 'use-wagmi/chains';

export const config = createConfig({
  chains: [mainnet, sepolia, hardhat],

  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hardhat.id]: http(),
  },

  ssr: false,
});

reconnect(config);

export const defaultChain = sepolia;
