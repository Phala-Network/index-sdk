import {generateId} from '../lib'
import {processSolution} from '../solution'
import {Solution} from '../types'
import {SubstrateChain} from './substrate'

export class PhalaChain extends SubstrateChain {
  async getDeposit(
    asset: string,
    amount: bigint,
    recipient: string,
    solution: Solution
  ) {
    this.assertReady()
    if (!this.client.validateSolution(solution)) {
      throw new Error('Solution is invalid')
    }
    const id = generateId()
    const worker = this.client.getWorker().account32
    const tx = this.api.tx.palletIndex.depositTask(
      asset,
      amount,
      recipient,
      worker,
      id,
      processSolution(this.client, solution, recipient)
    )
    return {id, tx}
  }
}
