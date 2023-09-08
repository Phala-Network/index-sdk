import {ethers} from 'ethers'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {ASSETS} from './assets'
import {Client, Environment} from './client'
import {Solution} from './types'

const solution: Solution = [
  {
    exeType: 'swap',
    exe: 'moonbeam_stellaswap',
    sourceChain: 'Moonbeam',
    destChain: 'Moonbeam',
    spendAsset: '0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080',
    receiveAsset: '0xFFFfFfFf63d24eCc8eB8a7b5D0803e900F7b6cED',
  },
]

describe('Client', () => {
  beforeEach(() => {
    vi.mock('./lib', () => ({
      generateId: vi.fn(
        () =>
          '0x0000000000000000000000000000000000000000000000000000000000000000'
      ),
    }))
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

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

    expect(approvalTx?.data).toMatchSnapshot()

    const deposit = await ethereum.getDeposit(
      asset,
      amount,
      '0x0000000000000000000000000000000000000000',
      solution
    )

    expect(deposit.tx.data).toMatchSnapshot()
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
    expect(phalaTx.tx.toHex()).matchSnapshot()
  })
})
