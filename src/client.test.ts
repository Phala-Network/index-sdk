import {ethers} from 'ethers'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {ASSETS} from './assets'
import {Client, Environment} from './client'
import {Solution} from './types'

const taskId =
  '0x0000000000000000000000000000000000000000000000000000000000000003'

const solution: Solution = [
  {
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
      generateId: vi.fn(() => taskId),
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
    // expect(await client.getSolution(taskId)).toMatchObject(solution)
    expect(client.initialized).toEqual(true)
    expect(client.chains.length).toBeGreaterThan(0)
  }, 30_000)

  test('create ethereum', async () => {
    vi.spyOn(Client.prototype, 'uploadSolution').mockResolvedValue()
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
  }, 30_000)

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
    expect(phalaTx.tx.toHex()).toMatchSnapshot()
  }, 30_000)
})
