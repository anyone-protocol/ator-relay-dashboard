import Logger from '@/utils/logger';

export class TxCache {
  private dbName: string;
  private objectStoreName: string;
  private keyPrefix: string;
  private readonly logger = new Logger('TxCache');

  constructor() {
    this.dbName = 'arweaveDataDB';
    this.objectStoreName = 'transactions';
    this.keyPrefix = 'ar://';
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName);

      request.onerror = () => {
        reject(new Error('Failed to open the IndexedDB database'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore(this.objectStoreName);
      };
    });
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public async getTransactionData<Data = any>(
    txId: string
  ): Promise<Data | null> {
    try {
      const {
        arweave: { gateway },
      } = useAppConfig();
      const db = await this.openDB();

      const fromCache = await new Promise<Data>((resolve, reject) => {
        const transaction = db.transaction(this.objectStoreName, 'readonly');
        const objectStore = transaction.objectStore(this.objectStoreName);
        const request = objectStore.get(this.keyPrefix + txId);

        request.onerror = () => {
          reject(new Error('Failed to get transaction data from IndexedDB'));
        };

        request.onsuccess = () => {
          resolve(request.result as Data);
        };
      });

      if (fromCache) {
        return fromCache;
      }

      const fetched = await $fetch<Data>(`${gateway}/${txId}`);
      await this.saveTransactionData(txId, fetched);

      return fetched;
    } catch (error) {
      this.logger.error('Failed to get transaction data', error);
    }

    return null;
  }

  public async saveTransactionData(
    txId: string,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    data: any
  ): Promise<void> {
    try {
      const db = await this.openDB();

      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(this.objectStoreName, 'readwrite');
        const objectStore = transaction.objectStore(this.objectStoreName);
        const request = objectStore.put(data, this.keyPrefix + txId);

        request.onerror = () => {
          reject(new Error('Failed to save transaction data'));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      this.logger.error('Failed to save transaction data', error);
    }
  }
}

const txCache = new TxCache();
export const useTxCache = () => txCache;
