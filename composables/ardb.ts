import ArDB from 'ardb';
import { useArweave } from './arweave';

const arweave = useArweave();
const ardb = new ArDB(arweave);

export const useArdb = () => ardb;
