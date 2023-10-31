import {describe, expect, test} from 'vitest'
import {Client, Environment} from './client'
import {processSolution} from './solution'
import {Solution} from './types'

const cases: Solution[] = [
  [
    {
      exe: 'moonbeam_stellaswap',
      sourceChain: 'Moonbeam',
      destChain: 'Moonbeam',
      spendAsset: '0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080',
      receiveAsset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
    },
    {
      exe: 'moonbeam_bridge_to_phala',
      sourceChain: 'Moonbeam',
      destChain: 'Phala',
      spendAsset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
      receiveAsset: '0x0000',
    },
  ],
  [
    {
      exe: 'ethereum_nativewrapper',
      sourceChain: 'Ethereum',
      destChain: 'Ethereum',
      spendAsset: '0x0000000000000000000000000000000000000000',
      receiveAsset: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
    {
      exe: 'ethereum_uniswapv2',
      sourceChain: 'Ethereum',
      destChain: 'Ethereum',
      spendAsset: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      receiveAsset: '0x6c5bA91642F10282b576d91922Ae6448C9d52f4E',
    },
    {
      exe: 'ethereum_sygmabridge_to_phala',
      sourceChain: 'Ethereum',
      destChain: 'Phala',
      spendAsset: '0x6c5bA91642F10282b576d91922Ae6448C9d52f4E',
      receiveAsset: '0x0000',
    },
    {
      exe: 'phala_bridge_to_astar',
      sourceChain: 'Phala',
      destChain: 'Astar',
      spendAsset: '0x0000',
      receiveAsset: '0x010100cd1f',
    },
    {
      exe: 'astar_bridge_to_astarevm',
      sourceChain: 'Astar',
      destChain: 'AstarEvm',
      spendAsset: '0x010100cd1f',
      receiveAsset: '0xFFFFFFFF00000000000000010000000000000006',
    },
    {
      exe: 'astar_evm_arthswap',
      sourceChain: 'AstarEvm',
      destChain: 'AstarEvm',
      spendAsset: '0xFFFFFFFF00000000000000010000000000000006',
      receiveAsset: '0xaeaaf0e2c81af264101b9129c00f4440ccf0f720',
    },
    {
      exe: 'astar_evm_arthswap',
      sourceChain: 'AstarEvm',
      destChain: 'AstarEvm',
      spendAsset: '0xaeaaf0e2c81af264101b9129c00f4440ccf0f720',
      receiveAsset: '0xFFFFFFFF00000000000000010000000000000003',
    },
  ],
  [
    {
      exe: 'moonbeam_bridge_to_phala',
      sourceChain: 'Moonbeam_a',
      destChain: 'Phala_a',
      spendAsset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED_a',
      receiveAsset: '0x0000_a',
    },
  ],
  [
    {
      exe: 'moonbeam_bridge_to_phala',
      sourceChain: 'Moonbeam',
      destChain: 'Moonbeam',
      spendAsset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
      receiveAsset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
    },
  ],
  [
    {
      exe: 'moonbeam_stellaswap',
      sourceChain: 'Moonbeam',
      destChain: 'Moonbeam',
      spendAsset: '0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080',
      receiveAsset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
    },
    {
      exe: 'moonbeam_bridge_to_phala',
      sourceChain: 'Khala',
      destChain: 'Phala',
      spendAsset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
      receiveAsset: '0x0000',
    },
  ],
]

describe('Solution', async () => {
  const client = new Client({environment: Environment.TESTNET})
  await client.isReady

  for (let i = 0; i < cases.length; i++) {
    const solution = cases[i]
    test(`Validate solution ${i + 1}`, () => {
      const isValid = client.validateSolution(solution)
      expect(isValid).toMatchSnapshot()
      if (isValid) {
        expect(
          processSolution(
            client,
            solution,
            '0x0000000000000000000000000000000000000000'
          )
        ).toMatchSnapshot()
      }
    })
  }
})
