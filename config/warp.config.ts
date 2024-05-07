import { WarpFactory } from "warp-contracts";
import { EthersExtension } from "warp-contracts-plugin-ethers";

const warp = WarpFactory.forMainnet({
  inMemory: true,
  dbLocation: "./cache/warp",
}).use(new EthersExtension());

export const relayRegistryAddress = "i3QRgntzJtTyUxfer-DS_fZpzFsTKD_VWvyrh4w0KM4";

export const contract = warp.contract(
  relayRegistryAddress
);
