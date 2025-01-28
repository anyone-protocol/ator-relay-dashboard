import { TurboFactory } from '@ardrive/turbo-sdk'

const bundlerControllerKey = process.env.BUNDLER_CONTROLLER_KEY || 'no key set'
const bundlerGateway = process.env.BUNDLER_GATEWAY || 'https://ar.anyone.tech'
const bundlerNode = process.env.BUNDLER_NODE || 'https://ar.anyone.tech/bundler'

const signer = new EthereumSigner(bundlerControllerKey)
const turbo = TurboFactory.authenticated({
  signer,
  gatewayUrl: bundlerGateway,
  uploadServiceConfig: { url: bundlerNode }
})

async function bundlerEthTest() {
  const data = 'hello from eth signed data item'
  const address = await turbo.signer.getNativeAddress()
  const pk = await turbo.signer.getPublicKey()
  console.log('using signer address', address)
  console.log('using signer pk', pk)
  const signed = await turbo.signer.signDataItem({
    fileSizeFactory: () => data.length,
    fileStreamFactory: () => Buffer.from(data),
    dataItemOpts: { tags: [{ name: 'Content-Type', value: 'text/plain' }] }
  })
  console.log('uploading')
  const result = await this.bundler.uploadSignedDataItem(signed)
  console.log('upload result', result)
}

bundlerEthTest().catch((err) => { console.error(err); process.exit(1); })
