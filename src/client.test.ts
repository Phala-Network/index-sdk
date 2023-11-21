import {ethers} from 'ethers'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {ASSETS} from './assets'
import {Client, Environment} from './client'
import {Solution} from './types'

const taskId =
  '0x0000000000000000000000000000000000000000000000000000000000000003'

const solution: Solution = [
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
    await client.simulateSolution(
      solution,
      '0x641017970d80738617e4e9b9b01d8d2ed5bc3d881a60e5105620abfbf5cb1331'
    )
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
