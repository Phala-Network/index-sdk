import {expect, test} from 'vitest'
import {createValidateFn} from './solution.js'

const chains: Chain[] = [
  {
    id: 0,
    name: 'Ethereum',
    endpoint: 'https://mainnet.infura.io/v3/6d61e7957c1c489ea8141e947447405b',
    chainType: 'Evm',
    nativeAsset: '0x0000000000000000000000000000000000000000',
    foreignAsset: null,
    handlerContract: '0xf9eae3ec6bfe94f510eb3a5de8ac9deb9e74df39',
    txIndexer: 'null',
  },
  {
    id: 1,
    name: 'Moonbeam',
    endpoint: 'https://moonbeam.api.onfinality.io/public',
    chainType: 'Evm',
    nativeAsset: '0x0000000000000000000000000000000000000000',
    foreignAsset: null,
    handlerContract: '0x635ea86804200f80c16ea8eddc3c749a54a9c37d',
    txIndexer: 'https://squid.subsquid.io/graph-moonbeam/graphql',
  },
  {
    id: 2,
    name: 'AstarEvm',
    endpoint: 'https://astar.public.blastapi.io',
    chainType: 'Evm',
    nativeAsset: '0x0000000000000000000000000000000000000000',
    foreignAsset: null,
    handlerContract: '0xb376b0ee6d8202721838e76376e81eec0e2fe864',
    txIndexer: 'https://squid.subsquid.io/graph-astar/graphql',
  },
  {
    id: 3,
    name: 'Astar',
    endpoint: 'https://astar.public.blastapi.io',
    chainType: 'Sub',
    nativeAsset: '0x010100591f',
    foreignAsset: 'PalletAsset',
    handlerContract: '0x00',
    txIndexer: 'https://squid.subsquid.io/graph-astar/graphql',
  },
  {
    id: 4,
    name: 'Khala',
    endpoint: 'https://khala-api.phala.network/rpc',
    chainType: 'Sub',
    nativeAsset: '0x0000',
    foreignAsset: 'PalletAsset',
    handlerContract: '0x79',
    txIndexer: 'https://squid.subsquid.io/graph-khala/graphql',
  },
  {
    id: 5,
    name: 'Phala',
    endpoint: 'https://api.phala.network/rpc',
    chainType: 'Sub',
    nativeAsset: '0x0000',
    foreignAsset: 'PalletAsset',
    handlerContract: '0x79',
    txIndexer: 'https://squid.subsquid.io/graph-phala/graphql',
  },
  {
    id: 6,
    name: 'Acala',
    endpoint: 'https://acala-rpc.dwellir.com',
    chainType: 'Sub',
    nativeAsset: '0x010200411f06080000',
    foreignAsset: 'OrmlToken',
    handlerContract: '0x00',
    txIndexer: 'https://squid.subsquid.io/graph-acala/graphql',
  },
]

const validate = createValidateFn(chains)

const cases: [any, boolean][] = [
  [
    [
      {
        exe_type: 'swap',
        exe: 'moonbeam_stellaswap',
        source_chain: 'Moonbeam',
        dest_chain: 'Moonbeam',
        spend_asset: '0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080',
        receive_asset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
      },
      {
        exe_type: 'bridge',
        exe: 'moonbeam_bridge_to_phala',
        source_chain: 'Moonbeam',
        dest_chain: 'Phala',
        spend_asset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
        receive_asset: '0x0000',
      },
    ],
    true,
  ],
  [
    [
      {
        exe_type: 'bridge_a',
        exe: 'moonbeam_bridge_to_phala',
        source_chain: 'Moonbeam_a',
        dest_chain: 'Phala_a',
        spend_asset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED_a',
        receive_asset: '0x0000_a',
      },
    ],
    false,
  ],
  [
    [
      {
        exe_type: 'bridge',
        exe: 'moonbeam_bridge_to_phala',
        source_chain: 'Moonbeam',
        dest_chain: 'Moonbeam',
        spend_asset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
        receive_asset: '0x0000',
      },
    ],
    false,
  ],
  [
    [
      {
        exe_type: 'swap',
        exe: 'moonbeam_bridge_to_phala',
        source_chain: 'Moonbeam',
        dest_chain: 'Moonbeam',
        spend_asset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
        receive_asset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
      },
    ],
    false,
  ],
  [
    [
      {
        exe_type: 'swap',
        exe: 'moonbeam_bridge_to_phala',
        source_chain: 'Moonbeam',
        dest_chain: 'Phala',
        spend_asset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
        receive_asset: '0x0000',
      },
    ],
    false,
  ],
  [
    [
      {
        exe_type: 'swap',
        exe: 'moonbeam_stellaswap',
        source_chain: 'Moonbeam',
        dest_chain: 'Moonbeam',
        spend_asset: '0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080',
        receive_asset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
      },
      {
        exe_type: 'bridge',
        exe: 'moonbeam_bridge_to_phala',
        source_chain: 'Khala',
        dest_chain: 'Phala',
        spend_asset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
        receive_asset: '0x0000',
      },
    ],
    false,
  ],
]

for (let i = 0; i < cases.length; i++) {
  const [solution, valid] = cases[i]
  test(`Validate solution ${i + 1}`, () => {
    expect(validate(solution)).toBe(valid)
  })
}
