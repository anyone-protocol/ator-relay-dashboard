import { WarpFactory } from "warp-contracts/web";
import { EthersExtension } from "warp-contracts-plugin-ethers";

const warp = WarpFactory.forMainnet({
  inMemory: true,
  dbLocation: "./cache/warp",
}).use(new EthersExtension());

export const contract = warp.contract(
  "R5PXlkYsP5HYVCzGhF9xzZXQqBog3KrRchp47aa5e3w"
);
