import Irys from '@irys/sdk'

const IRYS_NODE = 'https://node2.irys.xyz/'
const jwk = JSON.parse(
  Buffer.from(process.env.PERMAWEB_KEY || 'NO_KEY', 'base64').toString('utf-8')
)
const irys = new Irys({ url: IRYS_NODE, token: 'arweave', key: jwk })

async function fund() {
  const fundResponse = await irys.fund(irys.utils.toAtomic('0.1'))

  console.log('Fund response')
  console.dir(fundResponse)
}

fund().then().catch(err => { console.error(err); process.exit(1); })
