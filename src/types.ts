export type Hex = `0x${string}`

export type Worker = {account20: Hex; account32: Hex}

export interface Chain {
  id: number
  name: string
  endpoint: string
  chainType: 'Evm' | 'Sub'
  nativeAsset: Hex
  foreignAsset: 'PalletAsset' | 'OrmlToken' | null
  handlerContract: Hex
  txIndexer: string
}

export interface Step {
  exe_type: 'swap' | 'bridge'
  exe: string
  source_chain: string
  dest_chain: string
  spend_asset: string
  receive_asset: string
}

export type Solution = Step[]

interface TaskStep {
  exeType: 'bridge' | 'swap'
  exe: string
  sourceChain: string
  destChain: string
  spendAsset: Hex
  receiveAsset: Hex
  sender: null
  recipient: Hex
  spendAmount: number | string
  originBalance: number | string | null
  nonce: number | null
}
export interface Task {
  id: Hex
  worker: Hex
  status:
    | {executing: [number] | [number, number]}
    | {actived: null}
    | {initialized: null}
    | {completed: null}
  source: string
  amount: number | string
  claimNonce: number
  claimTx: Hex
  steps: TaskStep[]
  mergedSteps: Array<{batch: TaskStep[]} | {single: TaskStep}>
  executeTxs: Hex[]
  executeIndex: number
  sender: Hex
  recipient: Hex
  retryCounter: number
}
