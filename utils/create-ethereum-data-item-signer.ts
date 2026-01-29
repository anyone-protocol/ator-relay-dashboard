import { createData, Signer } from '@dha-team/arbundles';

export type SignedDataItemsCache = {
  [key: string]: {
    id: string;
    raw: Buffer;
  };
};

export function createEthereumDataItemSigner(
  signer: Signer,
  useCache: boolean = false,
  cache: SignedDataItemsCache = {}
) {
  return async ({
    data,
    tags,
    target,
    anchor,
  }: {
    data: string | Uint8Array;
    tags: { name: string; value: string }[];
    target?: string;
    anchor?: string;
  }) => {
    const cacheKey = tags.find((tag) => tag.name === 'UI-Cache-Key')?.value;
    if (useCache && cacheKey && cache && cache[cacheKey]) {
      return cache[cacheKey];
    }

    const dataItem = createData(data, signer, { tags, target, anchor });
    await dataItem.sign(signer);
    const result = {
      id: dataItem.id,
      raw: dataItem.getRaw(),
    };

    if (useCache && cacheKey && cache) {
      cache[cacheKey] = result;
    }

    return result;
  };
}
