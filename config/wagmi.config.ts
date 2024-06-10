import { reconnect } from 'use-wagmi/actions';
import { http, createConfig } from 'use-wagmi';
import { mainnet, sepolia, hardhat } from 'use-wagmi/chains';
import { defaultWagmiConfig } from '@web3modal/wagmi/vue';
import { metadata } from './web3modal.config';

const projectId = 'f5e29d36441ccd0e2f5e3473d5a2021b';

export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hardhat.id]: http(),
  },
  ssr: false,
});

export const wagmiConfig = defaultWagmiConfig({
  chains: [mainnet, sepolia],
  projectId,
  metadata,
  ssr: false,
});

void reconnect(config);

export const defaultChain = sepolia;
