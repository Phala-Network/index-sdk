import syncFetch from 'sync-fetch'

export interface Asset {
  name: string
  symbol: string
  decimals: number
  location: string
  chainName: string
}

const match = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase()

export const lookupAsset = (chain: string, symbol: string): Asset => {
  const registry = syncFetch(
    'https://raw.githubusercontent.com/Phala-Network/index-contract/closed-beta/scripts/src/registry.json'
  ).json()

  const asset = registry.assets.find(
    (x: Asset) => match(x.chainName, chain) && match(x.symbol, symbol)
  )
  if (asset == null) {
    throw new Error(`Asset not found: ${chain} ${symbol}`)
  }

  return asset
}
