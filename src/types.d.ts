type Hex = `0x${string}`

declare interface Chain {
  id: number
  name: string
  endpoint: string
  chainType: 'Evm' | 'Sub'
  nativeAsset: Hex
  foreignAsset: 'PalletAsset' | 'OrmlToken' | null
  handlerContract: Hex
  txIndexer: string
}

declare interface Step {
  exe_type: 'swap' | 'bridge'
  exe: string
  source_chain: string
  dest_chain: string
  spend_asset: string
  receive_asset: string
}

declare type Solution = Step[]
