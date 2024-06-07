import Arweave from 'arweave';

// NB: Use arweave mainnet locally
// const arweaveConfig =
//   window.location.hostname !== 'localhost'
//     ? { protocol: 'https', host: 'arweave.net', port: 443 }
//     : {};
const arweaveConfig = { protocol: 'https', host: 'arweave.net', port: 443 };

const arweave = Arweave.init(arweaveConfig);

export const useArweave = () => arweave;
