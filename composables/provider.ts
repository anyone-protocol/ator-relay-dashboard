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
  // TODO: Uncomment this
  // NETWORKS.SEPOLIA.decimal
  'http://127.0.0.1:8545/',
  {
    // NB: Required to force fallback provider. Errors with sepolia otherwise.
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
