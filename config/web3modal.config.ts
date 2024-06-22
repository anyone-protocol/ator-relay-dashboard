// https://docs.walletconnect.com/web3modal/vue/about
export const metadata = {
  name: 'Ator Dashboard',
  description:
    'ATOR empowers the adoption and strength of the Tor network. ATOR Proof-of-Uptime and relay hardware allow users to earn passively while contributing to Tor.',
  url: 'https://ator-dashboard.ar-io.dev/',
  icons: ['/images/AtorLogo.png'],
};

export const getAtorAddress = () => {
  const runtimeConfig = useRuntimeConfig();

  return runtimeConfig.public.sepoliaAtorTokenContract;
};

export const getAtorAddressMain = () => {
  const runtimeConfig = useRuntimeConfig();

  return runtimeConfig.public.tokenContractMain;
};

// https://docs.walletconnect.com/web3modal/vue/theming
export const themeVariables = {
  '--w3m-accent': '#06b6d4',
  '--w3m-border-radius-master': '0.125rem',
};
