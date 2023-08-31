import {ApiPromise, HttpProvider} from '@polkadot/api'
import {Executor} from '../executor'
import {Chain} from '../types'
import {BaseChain} from './base'

export abstract class SubstrateChain extends BaseChain {
  protected readonly api: ApiPromise
  constructor(chain: Chain, executor: Executor) {
    super(chain, executor)
    const provider = new HttpProvider(this.endpoint)
    this.api = new ApiPromise({provider, noInitWarn: true})
  }
  get isReady() {
    return this.api.isReady
  }
}
