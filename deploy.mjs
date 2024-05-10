import Bundlr from '@bundlr-network/client'
import { LoggerFactory, WarpFactory, defaultCacheOptions } from 'warp-contracts'
import Arweave from 'arweave'

const ANT = 'PspdulWYOoBov3dJyA9TdXuqDqaV7snSiwPjtesLvNU'
const DEPLOY_FOLDER = './.output/public'
const BUNDLR_NODE = 'https://node2.bundlr.network'

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
})

const jwk = JSON.parse(
  Buffer.from(
    process.env.PERMAWEB_KEY || 'NO_KEY', 'base64'
  ).toString('utf-8')
)

LoggerFactory.INST.logLevel('fatal')

const bundlr = new Bundlr.default(BUNDLR_NODE, 'arweave', jwk)
const warp = WarpFactory.custom(
  arweave,
  defaultCacheOptions,
  'mainnet'
).useArweaveGateway().build();
const contract = warp.contract(ANT).connect(jwk)

// upload folder
const result = await bundlr.uploadFolder(DEPLOY_FOLDER, {
  indexFile: 'index.html'
})

// update ANT
if (result) {
  console.log('bundlr result id', result.id)
  var subDomain = 'dev'
  if (process.env.PHASE === 'live') {
    subDomain = '@'
  } else if (process.env.PHASE === 'stage') {
    subDomain = 'stage'
  }

  console.log(`Deploying to: ${subDomain}`)

  const deployed = await contract.writeInteraction({
    function: 'setRecord',
    subDomain: subDomain,
    ttlSeconds: 3600,
    transactionId: result.id
  })

  console.log(
    'Deployed!  Please wait 20 - 30 minutes for ArNS to update!',
    deployed
  )
} else {
  console.error('Bundlr result error', result)
}
