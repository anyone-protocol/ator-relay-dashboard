export function useOperatorCache() {
  interface OperatorWithDomain {
    address: string;
    domains?: {
      tokenId: string;
      name: string;
      owner: string | undefined;
      tld: string;
    }[];
  }

  const DB_NAME = 'OperatorCache';
  const STORE_NAME = 'operators';
  const CACHE_KEY = 'operatorWithDomainsCache';

  async function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  function serializeOperators(
    operators: OperatorWithDomain[]
  ): OperatorWithDomain[] {
    return operators.map((operator) => ({
      ...operator,
      domains: operator.domains?.map((domain) => ({
        ...domain,
        tokenId: domain.tokenId.toString(),
      })),
    }));
  }

  function deserializeOperators(
    cached: OperatorWithDomain[]
  ): OperatorWithDomain[] {
    return cached.map((operator) => ({
      ...operator,
      domains: operator.domains?.map((domain) => ({
        ...domain,
        tokenId: domain.tokenId,
      })),
    }));
  }

  async function cacheOperators(
    operators: OperatorWithDomain[]
  ): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const serializedData = serializeOperators(operators);
      await new Promise<void>((resolve, reject) => {
        const request = store.put({ key: CACHE_KEY, data: serializedData });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      db.close();
    } catch (error) {
      console.error('Error caching operators:', error);
    }
  }

  async function getCachedOperators(): Promise<OperatorWithDomain[] | null> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = await new Promise<OperatorWithDomain[] | null>(
        (resolve, reject) => {
          const req = store.get(CACHE_KEY);
          req.onsuccess = () => {
            const data = req.result
              ? deserializeOperators(req.result.data)
              : null;
            console.log('Retrieved cached operators:', data);
            resolve(data);
          };
          req.onerror = () => reject(req.error);
        }
      );
      db.close();
      return request;
    } catch (error) {
      console.error('Error retrieving cached operators:', error);
      return null;
    }
  }

  async function clearCachedOperators(): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(CACHE_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      db.close();
    } catch (error) {
      console.error('Error clearing cached operators:', error);
    }
  }

  return {
    cacheOperators,
    getCachedOperators,
    clearCachedOperators,
  };
}
