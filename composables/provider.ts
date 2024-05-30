import { AbstractProvider, BrowserProvider, ethers } from 'ethers';

export const NETWORKS = {
  MAINNET: { decimal: 1, hex: '0x1', name: 'mainnet' },
  SEPOLIA: { decimal: 11155111, hex: '0xaa36a7', name: 'sepolia' },
  HARDHAT: { decimal: 31337, hex: '0x7a69', name: 'hardhat' },
};

export const useSuggestMetaMask = () =>
  useState<boolean | undefined>('suggest-meta-mask', () => false);

export const suggestMetaMask = useSuggestMetaMask();

var url = 'http://127.0.0.1:8545/';
var provider = new ethers.JsonRpcProvider(url);
// TODO: Uncomment this
// let provider: AbstractProvider | BrowserProvider = ethers.getDefaultProvider(
//   NETWORKS.SEPOLIA.decimal,
//   {
//     // NB: Required to force fallback provider. Errors with sepolia otherwise.
//     alchemy: '-',
//     ankr: '-',
//     cloudflare: '-',
//     etherscan: '-',
//     infura: '-',
//     hardhat: '-',
//   }
// );

export const initializeBrowserProvider = () => {
  // if (window && window.ethereum) {
  //   provider = new BrowserProvider(window.ethereum, NETWORKS.SEPOLIA.decimal);
  // }

  return provider;
};

export const useProvider = () => provider;
