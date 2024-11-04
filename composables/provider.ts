import { AbstractProvider, BrowserProvider, ethers } from 'ethers';

export const NETWORKS = {
  MAINNET: { decimal: 1, hex: '0x1', name: 'mainnet' },
  SEPOLIA: { decimal: 11155111, hex: '0xaa36a7', name: 'sepolia' },
  HARDHAT: { decimal: 31_337, hex: '0x7a69', name: 'hardhat' },
};

export const useSuggestMetaMask = () =>
  useState<boolean | undefined>('suggest-meta-mask', () => false);

export const suggestMetaMask = useSuggestMetaMask();

let provider: AbstractProvider | BrowserProvider = ethers.getDefaultProvider(
  'https://sepolia.drpc.org',
  {
    // NB: Required to force fallback provider. Errors with sepolia otherwise.
    tenderly: 'https://gateway.tenderly.co/public/sepolia',
    blastapi: 'https://eth-sepolia.public.blastapi.io',
    onerpc: 'https://1rpc.io/sepolia',
    alchemy: '-',
    ankr: '-',
    cloudflare: '-',
    etherscan: '-',
    infura: '-',
  }
);

export const initializeBrowserProvider = () => {
  if (window && window.ethereum) {
    provider = new BrowserProvider(window.ethereum);
  }

  return provider;
};

export const useProvider = () => provider;
