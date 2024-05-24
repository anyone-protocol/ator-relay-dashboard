import { WarpFactory } from 'warp-contracts';
import { EthersExtension } from 'warp-contracts-plugin-ethers';

const runtimeConfig = useRuntimeConfig();

const warp = WarpFactory.forMainnet({
  inMemory: true,
  dbLocation: './cache/warp',
}).use(new EthersExtension());

export const relayRegistryContract = warp.contract(
  runtimeConfig.public.relayRegistryAddress
);
