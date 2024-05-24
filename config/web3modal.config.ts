// https://docs.walletconnect.com/web3modal/vue/about
export const metadata = {
  name: 'Ator Dashboard',
  description:
    'ATOR empowers the adoption and strength of the Tor network. ATOR Proof-of-Uptime and relay hardware allow users to earn passively while contributing to Tor.',
  url: 'https://ator-dashboard.ar-io.dev/',
  icons: ['/images/ator-logo.png'],
};

export const atorAddress = '0x0f7b3f5a8fed821c5eb60049538a548db2d479ce';

// https://docs.walletconnect.com/web3modal/vue/options#tokens
export const tokens = {
  1: {
    address: atorAddress,
    image: '/images/ator-logo.png',
  },
};

// https://docs.walletconnect.com/web3modal/vue/theming
export const themeVariables = {
  '--w3m-accent': '#06b6d4',
  '--w3m-border-radius-master': '0.125rem',
};
