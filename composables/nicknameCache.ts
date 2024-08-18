import Logger from '@/utils/logger';

class NickNameCache {
  private dbName: string;
  private objectStoreName: string;
  private readonly logger = new Logger('NickNameCache');
  private cacheDuration = 5 * 60 * 1000;

  constructor() {
    this.dbName = 'nicknameDataDB';
    this.objectStoreName = 'nicknames';
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        this.logger.error('Failed to open the IndexedDB database');
        reject(new Error('Failed to open the IndexedDB database'));
      };

      request.onsuccess = () => {
        this.logger.info('IndexedDB database opened successfully');
        resolve(request.result);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.objectStoreName)) {
          db.createObjectStore(this.objectStoreName);
          this.logger.info('Created object store:', this.objectStoreName);
        }
      };
    });
  }

  public async getNickNames<Data = any>(key: string): Promise<Data | null> {
    try {
      const db = await this.openDB();

      const fromCache = await new Promise<{
        data: string;
        timestamp: number;
      } | null>((resolve, reject) => {
        const transaction = db.transaction(this.objectStoreName, 'readonly');
        const objectStore = transaction.objectStore(this.objectStoreName);
        const request = objectStore.get(key);

        request.onerror = () => {
          this.logger.error('Failed to get nickname data from IndexedDB');
          reject(new Error('Failed to get nickname data from IndexedDB'));
        };

        request.onsuccess = () => {
          resolve(request.result as { data: string; timestamp: number } | null);
        };
      });

      if (fromCache) {
        // this.logger.info(`Cache hit for key: ${key}`, fromCache);
      } else {
        // this.logger.info(`Cache miss for key: ${key}`);
      }

      if (fromCache && Date.now() - fromCache.timestamp < this.cacheDuration) {
        this.logger.info('Returning cached data:', fromCache.data);
        return JSON.parse(fromCache.data) as Data;
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to get nickname data', error);
      return null;
    }
  }

  public async saveNickNames(key: string, data: any): Promise<void> {
    try {
      const db = await this.openDB();
      const timestamp = Date.now();

      this.logger.info(`Saving data for key: ${key}`, data);

      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(this.objectStoreName, 'readwrite');
        const objectStore = transaction.objectStore(this.objectStoreName);
        const request = objectStore.put({ data: data, timestamp }, key);

        request.onerror = () => {
          this.logger.error('Failed to save nickname data');
          reject(new Error('Failed to save nickname data'));
        };

        request.onsuccess = () => {
          this.logger.info(`Data saved for key: ${key}`);
          resolve();
        };
      });
    } catch (error) {
      this.logger.error('Failed to save nickname data', error);
    }
  }
}

const nickNameCache = new NickNameCache();
export const useNickNameCache = () => nickNameCache;
