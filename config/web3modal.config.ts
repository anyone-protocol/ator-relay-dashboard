// https://docs.walletconnect.com/web3modal/vue/about
export const metadata = {
  name: 'Anyone Dashboard',
  description:
    'The Anyone dashboard is purpose-built for relay operators - those who maintain the nodes of the Anyone Network - and stakers - holders of the ANYONE token who can delegate their trust to operators.',
  url: 'https://dashboard.anyone.io/',
  icons: ['/images/ator-logo.png'],
};

export const getAnonAddress = () => {
  const runtimeConfig = useRuntimeConfig();

  return runtimeConfig.public.phase === 'live'
    ? runtimeConfig.public.atorTokenContract
    : runtimeConfig.public.sepoliaAtorTokenContract;
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
