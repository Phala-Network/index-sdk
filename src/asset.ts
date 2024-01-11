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

export const lookupAsset = (
  chain: string,
  symbolOrLocation: string
): Asset | undefined => {
  const registry = syncFetch(
    'https://raw.githubusercontent.com/Phala-Network/index-contract/closed-beta/scripts/src/registry.json'
  ).json() as {assets: Asset[]}

  const asset = registry.assets.find(
    (x) =>
      match(x.chainName, chain) &&
      (match(x.symbol, symbolOrLocation) || match(x.location, symbolOrLocation))
  )

  return asset
}
