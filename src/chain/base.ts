import {Client} from '../client'
import {Chain, Hex, Solution} from '../types'

export abstract class BaseChain {
  protected readonly client: Client
  protected readonly endpoint: string
  protected readonly nativeAsset: string
  protected readonly handlerContractAddress: string
  readonly name: string
  abstract getDeposit(
    asset: string,
    amount: bigint,
    recipient: string,
    solution: Solution
  ): Promise<{id: Hex; tx: unknown}>

  constructor(chain: Chain, client: Client) {
    this.name = chain.name
    this.endpoint = chain.endpoint
    this.nativeAsset = chain.nativeAsset
    this.handlerContractAddress = chain.handlerContract
    this.client = client
  }
}
