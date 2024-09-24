import Arweave from 'arweave';

// NB: Use arweave mainnet locally
const arweaveConfig =
  window.location.hostname === 'localhost'
    ? { protocol: 'https', host: 'arweave.net', port: 443 }
    : window.location.hostname === 'dashboard.anyone.io'
      ? { protocol: 'https', host: 'ar.anyone.tech', port: 443 }
      : {};
// : { protocol: 'https', host: window.location.hostname , port: 443 }; / removed on prod

const arweave = Arweave.init(arweaveConfig);

export const useArweave = () => arweave;
