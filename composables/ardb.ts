import ArDB from 'ardb';
import { useArweave } from './arweave';

const arweave = useArweave();
const ardb = new ArDB(arweave);

export const useArdb = () => ardb;

export async function getLatestBlockHeight(): Promise<number> {
  const { height } = await arweave.blocks.getCurrent();
  return height;
}

export async function calculateMinimumQueryBlockHeight(
  latestHeight: number
): Promise<number> {
  const blocksPerMonth = 60 * 24 * 30;
  const twoWeeksAgo = Math.floor(blocksPerMonth / 4);
  return latestHeight - twoWeeksAgo;
}
