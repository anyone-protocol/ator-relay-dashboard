import { AbstractProvider, BrowserProvider, ethers } from 'ethers'

export const NETWORKS = {
  MAINNET: { decimal: 1, hex: '0x1', name: 'mainnet' },
  GOERLI: { decimal: 5, hex: '0x5', name: 'goerli' }
}

export const useSuggestMetaMask = () => useState<boolean | undefined>(
  'suggest-meta-mask',
  () => false
)

export const suggestMetaMask = useSuggestMetaMask()

let provider: AbstractProvider | BrowserProvider = ethers.getDefaultProvider(
  NETWORKS.GOERLI.decimal,
  {
    // NB: Required to force fallback provider.  Errors with goerli otherwise.
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
      NETWORKS.GOERLI.decimal
    )
  }

  return provider
}

export const useProvider = () => provider
