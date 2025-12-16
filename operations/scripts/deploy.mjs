import { ANT, ArweaveSigner } from '@ar.io/sdk'
import { TurboFactory } from '@ardrive/turbo-sdk'

import { logger } from './util/logger.mjs'

// ar://anyone process id (latest)
const processId = 'MI3R01E2jfo2ailiPXDBLqHlcnUlRfrlGjR0ATjsMi0'
const DEPLOY_FOLDER = `${process.cwd()}/.output/public`
const gatewayUrl = process.env.GATEWAY || 'https://ar.anyone.tech'
const url = process.env.BUNDLER || 'https://ar.anyone.tech/bundler'
const permawebKey = process.env.PERMAWEB_KEY || 'NO_KEY'

let undername = 'dev'
if (process.env.PHASE === 'stage') {
  undername = 'stage'
} else if (process.env.PHASE === 'live') {
  undername = '@'
} else if (process.env.UNDERNAME) {
  undername = process.env.UNDERNAME
}

async function deploy() {
  const jwk = JSON.parse(Buffer.from(permawebKey, 'base64').toString('utf-8'))
  const signer = new ArweaveSigner(jwk)
  const turbo = TurboFactory.authenticated({
    signer,
    gatewayUrl,
    uploadServiceConfig: { url, logger }
  })
  const ant = ANT.init({ processId, signer, logger })
  const {
    manifestResponse,
    manifest,
    errors
  } = await turbo.uploadFolder({
    folderPath: DEPLOY_FOLDER,
    dataItemOpts: {
      tags: [{ name: 'Deploy-Nonce', value: Date.now().toString() }],
    },
    manifestOptions: {
      indexFile: 'index.html',
      fallbackFile: 'index.html'
    }
  })

  if (errors && errors.length > 0) {
    logger.error(errors)
    throw new Error('Deploy failed, see errors above')
  }
  logger.info(`Deployed to Arweave with manifest id: ${manifestResponse?.id}`)
  logger.info('Deployed manifest:', JSON.stringify(manifest))
  logger.info('Updating ANT undername', undername)
  const { id: deployedMessageId } = undername === '@'
    ? await ant.setBaseNameRecord({
      transactionId: manifestResponse?.id,
      ttlSeconds: 3600
    })
    : await ant.setUndernameRecord({
      undername,
      transactionId: manifestResponse?.id,
      ttlSeconds: 3600
    })
  logger.info(
    `ANT updated! TTL 1 hour. View Set-Record message at `
      + `https://aolink.ar.anyone.tech/#/entity/${deployedMessageId}`
  )
}

deploy().catch(err => {
  logger.error('error deploying!', err)
  process.exit(1)
})
