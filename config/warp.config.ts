import { WarpFactory } from "warp-contracts";
import { EthersExtension } from "warp-contracts-plugin-ethers";

const warp = WarpFactory.forMainnet({
  inMemory: true,
  dbLocation: "./cache/warp",
}).use(new EthersExtension());

export const relayRegistryAddress = "4HNMS4Re99VGS-ZnnUnzLyk8wpx5XKQ2miOYEjUvWrU";

export const contract = warp.contract(
  relayRegistryAddress
);
