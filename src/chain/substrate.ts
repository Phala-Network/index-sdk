import {ApiPromise, HttpProvider} from '@polkadot/api'
import {SubmittableExtrinsic} from '@polkadot/api/types'
import {ISubmittableResult} from '@polkadot/types/types'
import {Client} from '../client'
import {Chain, Solution} from '../types'
import {BaseChain} from './base'

export abstract class SubstrateChain extends BaseChain {
  initialized = false
  protected readonly api: ApiPromise
  constructor(chain: Chain, client: Client) {
    super(chain, client)
    const provider = new HttpProvider(this.endpoint)
    this.api = new ApiPromise({provider, noInitWarn: true})
    this.api.isReady.then(() => {
      this.initialized = true
    })
  }
  protected assertReady() {
    if (!this.initialized) {
      throw new Error('Chain is not ready')
    }
  }
  get isReady() {
    return this.api.isReady.then(() => this)
  }
  abstract getDeposit(
    asset: string,
    amount: bigint,
    recipient: string,
    solution: Solution
  ): Promise<{
    id: `0x${string}`
    tx: SubmittableExtrinsic<'promise', ISubmittableResult>
  }>
}
