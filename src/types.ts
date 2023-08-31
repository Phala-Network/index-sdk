export type Hex = `0x${string}`

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

export interface Task {
  id: Hex
  worker: Hex
  status: string
  source: string
  steps: Hex
  execute_index: number
  sender: Hex
  recipient: Hex
}
