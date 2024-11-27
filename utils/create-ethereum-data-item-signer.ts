import { createData, Signer } from './arbundles-lite';

export async function createEthereumDataItemSigner(signer: Signer) {
  return ({
    data,
    tags,
    target,
    anchor,
  }: {
    data: string | Uint8Array;
    tags: any[];
    target?: string;
    anchor?: string;
  }) => {
    const dataItem = createData(data, signer, { tags, target, anchor });

    return dataItem.sign(signer).then(async () => ({
      id: await dataItem.id,
      raw: await dataItem.getRaw(),
    }));
  };
}
