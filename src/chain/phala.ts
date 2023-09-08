import {generateId} from '../lib'
import {encodeSolution} from '../solution'
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
    if (!this.client.validateSolution(solution)) {
      throw new Error('Solution is invalid')
    }
    const id = generateId()
    const worker = (await this.client.getWorker()).account32
    const tx = this.api.tx.palletIndex.depositTask(
      asset,
      amount,
      recipient,
      worker,
      id,
      encodeSolution(solution)
    )
    return {id, tx}
  }
}
