import { reconnect } from '@wagmi/core';
import { defaultWagmiConfig } from '@web3modal/wagmi/vue';
import { metadata } from './web3modal.config';
import { mainnet, sepolia } from 'viem/chains';
import { http } from '@wagmi/vue';

const projectId = 'f5e29d36441ccd0e2f5e3473d5a2021b';

export const config = defaultWagmiConfig({
  chains: [/*mainnet,*/ sepolia],
  transports: {
    // [mainnet.id]: http(),
    [sepolia.id]: http('https://ethereum-sepolia.rpc.subquery.network/public'),
  },
  projectId,
  metadata,
  ssr: false,
});

reconnect(config);

export const defaultChain = sepolia;
