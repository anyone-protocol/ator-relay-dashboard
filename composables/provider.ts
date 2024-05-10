import { AbstractProvider, BrowserProvider, ethers } from 'ethers'

export const NETWORKS = {
  MAINNET: { decimal: 1, hex: '0x1', name: 'mainnet' },
  SEPOLIA: { decimal: 11155111, hex: '0xaa36a7', name: 'sepolia' }
}

export const useSuggestMetaMask = () => useState<boolean | undefined>(
  'suggest-meta-mask',
  () => false
)

export const suggestMetaMask = useSuggestMetaMask()

let provider: AbstractProvider | BrowserProvider = ethers.getDefaultProvider(
  NETWORKS.SEPOLIA.decimal,
  {
    // NB: Required to force fallback provider. Errors with sepolia otherwise.
    alchemy: '-',
    ankr: '-',
    cloudflare: '-',
    etherscan: '-',
    infura: '-'
  }
)

export const initializeBrowserProvider = () => {
  if (window && window.ethereum) {
    provider = new BrowserProvider(
      window.ethereum,
      NETWORKS.SEPOLIA.decimal
    )
  }

  return provider
}

export const useProvider = () => provider
