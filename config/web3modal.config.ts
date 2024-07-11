// https://docs.walletconnect.com/web3modal/vue/about
export const metadata = {
  name: 'AnyOne Dashboard',
  description:
    'AnyOne empowers the adoption and strength of the Tor network. AnyOne Proof-of-Uptime and relay hardware allow users to earn passively while contributing to Tor.',
  url: 'https://ator-dashboard.ar-io.dev/',
  icons: ['/images/ator-logo.png'],
};

export const getAnonAddress = () => {
  const runtimeConfig = useRuntimeConfig();

  return runtimeConfig.public.sepoliaAtorTokenContract;
};

export const getAnonAddressMain = () => {
  const runtimeConfig = useRuntimeConfig();

  return runtimeConfig.public.tokenContractMain;
};

// https://docs.walletconnect.com/web3modal/vue/theming
export const themeVariables = {
  '--w3m-accent': '#06b6d4',
  '--w3m-border-radius-master': '0.125rem',
};
