import type { EvolveState } from 'warp-contracts'

export type ContractFunctionInput = {
  function: string
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  [key: string]: any
}
export type EvolvableState = Partial<EvolveState> & OwnableState
export type OwnableState = { owner?: string }
export type Fingerprint = string
export type EvmAddress = string

export interface Claimable extends ContractFunctionInput {
  function: 'claimable'
  address?: EvmAddress
}

export const formatTorFingerprint = (fingerprintHex: string) => {
  if (fingerprintHex === '0x0000000000000000000000000000000000000000') {
    return ''
  }

  return fingerprintHex.substring(2).toUpperCase()
}

interface TransactionReceiptLogJSON {
  readonly _type: 'log'
  readonly address: string
  readonly blockHash: string
  readonly blockNumber: number
  readonly data: string
  readonly index: number
  readonly removed: boolean
  readonly topics: string[]
  readonly transactionHash: string
  readonly transactionIndex: number
}

export interface TransactionReceiptJSON {
  readonly _type: 'TransactionReceipt'
  readonly blockHash: string
  readonly blockNumber: number
  readonly contractAddress: string | null
  readonly cumulativeGasUsed: string | null
  readonly from: string
  readonly gasPrice: string | null
  readonly gasUsed: string | null
  readonly hash: string,
  readonly index: number,
  readonly logs: TransactionReceiptLogJSON[],
  readonly logsBloom: string,
  readonly root: string | null,
  readonly status: number | null,
  readonly to: string | null
}
