import Irys from '@irys/sdk'

// Requires: PERMAWEB_KEY
// $ node operations/fund-deployer.mjs

const IRYS_NODE = 'https://node2.irys.xyz/'
const jwk = JSON.parse(
  Buffer.from(process.env.PERMAWEB_KEY || 'NO_KEY', 'base64').toString('utf-8')
)
const irys = new Irys({ url: IRYS_NODE, token: 'arweave', key: jwk })

async function fundDeployer() {  
	try {
    // const preBalance = await irys.getBalance('jp0QaS_Zai2hGaB-yRvAIMEtodmH_iHr0drpZxAZQtU')
    const preBalance = await irys.getLoadedBalance()
    console.log(`Irys loaded balance: ${preBalance}`)
		// const fundTx = await irys.fund(irys.utils.toAtomic(0.1))
		// console.log(`Successfully funded ${irys.utils.fromAtomic(fundTx.quantity)} ${irys.token}`)
	} catch (e) {
		console.log('Error interacting with permadata ', e)
	}

}

fundDeployer().then().catch(err => console.error(err))
