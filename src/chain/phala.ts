import {Solution} from '../types'
import {SubstrateChain} from './substrate'

export class PhalaChain extends SubstrateChain {
  async getDeposit(
    asset: string,
    amount: bigint,
    recipient: string,
    solution: Solution
  ) {
    this.requireReady()
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
