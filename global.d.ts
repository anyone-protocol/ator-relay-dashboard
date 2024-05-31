import { Eip1193Provider } from 'ethers';

declare global {
  interface Window {
    ethereum: Eip1193Provider;
  }
}

declare module 'warp-contracts';
declare module 'lodash.kebabCase';
