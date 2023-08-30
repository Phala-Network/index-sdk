import {Executor} from '../executor'
import {SubstrateChain} from './substrate'

export class PhalaChain extends SubstrateChain {
  constructor(chain: Chain, executor: Executor) {
    super(chain, executor)
  }
  async getDeposit(
    asset: string,
    amount: bigint,
    recipient: string,
    solution: Solution
  ) {
    const id = PhalaChain.generateId()
    return {id, tx: {}}
  }
}
