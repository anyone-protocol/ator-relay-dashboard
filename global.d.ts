import { Eip1193Provider } from 'ethers';

declare global {
  interface Window {
    ethereum: Eip1193Provider;
  }
}

declare module '@wagmi/vue' {
  interface Register {
    config: typeof config;
  }
}
