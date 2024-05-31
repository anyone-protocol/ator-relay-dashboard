import { reconnect } from 'use-wagmi/actions';
import { http, createConfig } from 'use-wagmi';
import { mainnet, sepolia, hardhat } from 'use-wagmi/chains';

export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hardhat.id]: http(),
  },
  ssr: false,
});

reconnect(config);

// TODO: change to sepolia
export const defaultChain = sepolia;
