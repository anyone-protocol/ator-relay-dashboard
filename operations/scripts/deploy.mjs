import { ANT, ArweaveSigner } from '@ar.io/sdk'
import { copyFileSync } from 'fs'

// ator-dashboard process id
// const processId = '9UpvN6H7sMo0vkuQeou3Ra0pZguWavtpt_8lfqPQlI8'

// anyone process id
// const processId = 'lZKDfIa5JiWQ8ojjXiRSey_81Bftbib4tLpIJh4UO0g'
const processId = 'Rglgc93lGIpqHIgNo9rS0gIkG2s7aodCSMoGysi3r6Y'

const DEPLOY_FOLDER = `${process.cwd()}/.output/public`
const gatewayUrl = process.env.GATEWAY || 'https://ar.anyone.tech'
const url = process.env.BUNDLER || 'https://ar.anyone.tech/bundler'
const jwk = JSON.parse(
  Buffer.from(process.env.PERMAWEB_KEY || 'NO_KEY', 'base64').toString('utf-8')
)
const signer = new ArweaveSigner(jwk)
const turbo = TurboFactory.authenticated({
  signer,
  gatewayUrl,
  uploadServiceConfig: { url }
})
const ant = ANT.init({ processId, signer })

let undername = 'dev'
if (process.env.PHASE === 'stage') {
  undername = 'stage'
} else if (process.env.PHASE === 'live') {
  undername = '@'
} else if (process.env.UNDERNAME) {
  undername = process.env.UNDERNAME
}

async function deploy() {
  // Hack: copy index.html to a file named "*" so it gets added to manifest as
  //       a wildcard route
  copyFileSync(DEPLOY_FOLDER + '/index.html', DEPLOY_FOLDER + '/*')

  const {
    fileResponses,
    manifestResponse,
    manifest,
    errors
  } = await turbo.uploadFolder({ folderPath: DEPLOY_FOLDER })

  if (errors && errors.length > 0) {
    console.error(errors)
    throw new Error('Deploy failed, see errors above')
  }
  console.log(`Manifest id ${manifestResponse?.id}`)
  console.log('Manifest', manifest)
  console.log('Updating ANT undername', undername)
  const { id: deployedTxId } = await ant.setRecord({
    undername,
    transactionId: manifestResponse?.id,
    ttlSeconds: 3600
  })
  console.log(
    'Deployed!  Please wait 20 - 30 minutes for ARNS to update!',
    deployedTxId
  )
}

deploy().then().catch(err => { console.error(err); process.exit(1); })
