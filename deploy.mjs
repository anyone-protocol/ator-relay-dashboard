import Irys from '@irys/sdk';
import {
  LoggerFactory,
  WarpFactory,
  defaultCacheOptions,
} from 'warp-contracts';
import Arweave from 'arweave';

const ANT = 'PspdulWYOoBov3dJyA9TdXuqDqaV7snSiwPjtesLvNU';
const DEPLOY_FOLDER = './.output/public';
const IRYS_NODE = 'https://node2.irys.xyz/';

const jwk = JSON.parse(
  Buffer.from(process.env.PERMAWEB_KEY || 'NO_KEY', 'base64').toString('utf-8')
);

LoggerFactory.INST.logLevel('fatal');

const irys = new Irys({ url: IRYS_NODE, token: 'arweave', key: jwk });

// upload folder
const result = await irys.uploadFolder(DEPLOY_FOLDER, {
  indexFile: 'index.html',
});

// update ANT
if (result) {
  console.log('irys result id', result.id);
  var subDomain = 'dev';
  if (process.env.PHASE === 'live') {
    subDomain = '@';
  } else if (process.env.PHASE === 'stage') {
    subDomain = 'stage';
  }

  console.log(`Deploying to: ${subDomain}`);

  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
  });

  const warp = WarpFactory.custom(arweave, defaultCacheOptions, 'mainnet')
    .useArweaveGateway()
    .build();
  const contract = warp.contract(ANT).connect(jwk);

  const deployed = await contract.writeInteraction({
    function: 'setRecord',
    subDomain: subDomain,
    ttlSeconds: 3600,
    transactionId: result.id,
  });

  console.log(
    'Deployed!  Please wait 20 - 30 minutes for ArNS to update!',
    deployed
  );
} else {
  console.error('Irys result error', result);
}
