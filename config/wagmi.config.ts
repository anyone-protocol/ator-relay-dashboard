import { reconnect } from '@wagmi/core';
import { defaultWagmiConfig } from '@web3modal/wagmi/vue';
import { metadata } from './web3modal.config';
import { mainnet, sepolia } from 'viem/chains';
import { http } from '@wagmi/vue';

const projectId = '53a5b087ab4cb303a799325360098216';

export const config = defaultWagmiConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http('https://eth-mainnet.public.blastapi.io'),
    [sepolia.id]: http('https://ethereum-sepolia.rpc.subquery.network/public'),
  },
  projectId,
  metadata,
  ssr: false,
});

export const mainNetConfig = defaultWagmiConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  projectId,
  metadata,
  ssr: false,
});

reconnect(config);

export const defaultChain = sepolia;
