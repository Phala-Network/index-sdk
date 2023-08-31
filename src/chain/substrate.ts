import {ApiPromise, HttpProvider} from '@polkadot/api'
import {Executor} from '../executor'
import {Chain} from '../types'
import {BaseChain} from './base'

export abstract class SubstrateChain extends BaseChain {
  #initialized = false
  protected readonly api: ApiPromise
  constructor(chain: Chain, executor: Executor) {
    super(chain, executor)
    const provider = new HttpProvider(this.endpoint)
    this.api = new ApiPromise({provider, noInitWarn: true})
    this.api.isReady.then(() => {
      this.#initialized = true
    })
  }
  protected requireReady() {
    if (!this.#initialized) {
      throw new Error('Chain is not ready')
    }
  }
  get isReady() {
    return this.api.isReady
  }
}
