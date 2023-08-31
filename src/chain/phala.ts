import {Executor} from '../executor'
import {Chain, Solution} from '../types'
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
    if (!this.executor.validateSolution(solution)) {
      throw new Error('Solution is invalid')
    }
    const id = PhalaChain.generateId()
    const worker = (await this.executor.getWorker()).account32
    const tx = this.api.tx.palletIndex.depositTask(
      asset,
      amount,
      recipient,
      worker,
      id,
      JSON.stringify(solution)
    )
    return {id, tx}
  }
}
