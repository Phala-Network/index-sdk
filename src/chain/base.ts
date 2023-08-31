import {Executor} from '../executor'
import {Chain, Hex, Solution} from '../types'

export abstract class BaseChain {
  protected readonly executor: Executor
  protected readonly endpoint: string
  protected readonly handlerContractAddress: string
  readonly name: string
  abstract getDeposit(
    asset: string,
    amount: bigint,
    recipient: string,
    solution: Solution
  ): Promise<{id: Hex; tx: unknown}>

  protected static generateId(length = 32): Hex {
    const array = new Uint8Array(length)
    const crypto =
      typeof window === 'undefined'
        ? require('crypto').webcrypto
        : window.crypto
    crypto.getRandomValues(array)
    return `0x${Buffer.from(array).toString('hex')}`
  }

  constructor(chain: Chain, executor: Executor) {
    this.name = chain.name
    this.endpoint = chain.endpoint
    this.handlerContractAddress = chain.handlerContract
    this.executor = executor
  }
}
