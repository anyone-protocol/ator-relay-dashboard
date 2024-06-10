const contracts = {
  erc20: '0x0f7b3f5a8fed821c5eb60049538a548db2d479ce',
  uniswapPair: '0xa7480AAfA8AD2af3ce24Ac6853F960AE6Ac7F0c4',
};

export default defineAppConfig({
  ui: {
    primary: 'cyan',
    gray: 'neutral',
    modal: {
      overlay: {
        background: 'bg-gray-200/75 dark:bg-gray-800/75 backdrop-blur',
      },
    },
  },
  contracts,
  arweave: {
    gateway: 'https://arweave.net',
  },
});
