import {ethers} from 'ethers'
import {describe, expect, test} from 'vitest'
import {ASSETS} from './assets'
import {Client, Environment} from './client'
import {Solution} from './types'

const solution: Solution = [
  {
    exe_type: 'swap',
    exe: 'moonbeam_stellaswap',
    source_chain: 'Moonbeam',
    dest_chain: 'Moonbeam',
    spend_asset: '0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080',
    receive_asset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
  },
]

describe('Client', () => {
  let client: Client
  test('initialization', async () => {
    client = new Client({environment: Environment.TESTNET})
    expect(() => client.createEvmChain('Ethereum')).toThrowError(
      'Client is not ready'
    )
    await client.isReady
    expect(client.initialized).toEqual(true)
    expect(client.chains.length).toBeGreaterThan(0)
  })

  test('create ethereum', async () => {
    await client.isReady
    const ethereum = client.createEvmChain('Ethereum')
    const asset = ASSETS.Ethereum.PHA
    const account = '0x0000000000000000000000000000000000000000'
    const amount = ethers.parseEther('1')
    const approvalTx = await ethereum.getApproval(asset, account, amount)

    expect(approvalTx?.data).toBe(
      '0x095ea7b3000000000000000000000000f9eae3ec6bfe94f510eb3a5de8ac9deb9e74df390000000000000000000000000000000000000000000000000de0b6b3a7640000'
    )

    const deposit = await ethereum.getDeposit(
      asset,
      amount,
      '0x0000000000000000000000000000000000000000',
      solution
    )
  })

  test('create phala', async () => {
    await client.isReady

    const phala = client.createPhalaChain('Phala')
    await phala.isReady
    const phalaTx = await phala.getDeposit(
      ASSETS.Phala.PHA,
      1_000_000_000_000n,
      '0x6c5bA91642F10282b576d91922Ae6448C9d52f4E',
      solution
    )
  })
})