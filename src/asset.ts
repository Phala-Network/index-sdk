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
  const chains = syncFetch(
    'https://index-gpt-server.vercel.app/api/registry/chains'
  ).json() as [{name: string; assets: Omit<Asset, 'chainName'>[]}]

  const matchedChain = chains.find((x) => match(x.name, chain))
  if (matchedChain != null) {
    const matchedAsset = matchedChain.assets.find(
      (x) =>
        match(x.symbol, symbolOrLocation) || match(x.location, symbolOrLocation)
    )
    if (matchedAsset != null) {
      return {
        ...matchedAsset,
        chainName: matchedChain.name,
      }
    }
  }
}
