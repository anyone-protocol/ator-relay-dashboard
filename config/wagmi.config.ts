import { http, createConfig, reconnect } from "@wagmi/core";
import { mainnet, sepolia } from "@wagmi/core/chains";

export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: false,
});

reconnect(config);

export const defaultChain = sepolia;
