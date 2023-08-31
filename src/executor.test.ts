import {ethers} from 'ethers'
import {describe, expect, test} from 'vitest'
import {EvmChain} from './chain'
import {PhalaChain} from './chain/phala'
import {Environment, Executor} from './executor'

describe('Executor', () => {
  let executor: Executor
  test('initialization', async () => {
    executor = new Executor({environment: Environment.TESTNET})
    expect(() => executor.createChain('Ethereum')).rejects.toThrowError(
      'Executor is not ready'
    )
    await executor.isReady
    expect(executor.initialized).toEqual(true)
    expect(executor.chains.length).toBeGreaterThan(0)
  })

  test('create ethereum', async () => {
    await executor.isReady
    const ethereum = (await executor.createChain('Ethereum')) as EvmChain
    const asset = '0x6c5bA91642F10282b576d91922Ae6448C9d52f4E'
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
      []
    )
  })

  test('create phala', async () => {
    await executor.isReady

    const phala = (await executor.createChain('Phala')) as PhalaChain
    const phalaTx = await phala.getDeposit(
      '0x00',
      1_000_000_000_000n,
      '0x6c5bA91642F10282b576d91922Ae6448C9d52f4E',
      []
    )
  })
})
