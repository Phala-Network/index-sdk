import {JsonRpcProvider, ethers} from 'ethers'
import {Client} from '../client'
import {Erc20__factory, Handler__factory} from '../ethersContracts'
import {generateId} from '../lib'
import {$solution} from '../solution'
import {Chain, Solution} from '../types'
import {BaseChain} from './base'

export class EvmChain extends BaseChain {
  #provider: JsonRpcProvider
  constructor(chain: Chain, client: Client) {
    super(chain, client)
    this.#provider = new ethers.JsonRpcProvider(this.endpoint)
  }

  async getApproval(asset: string, account: string, amount: bigint) {
    const erc20 = Erc20__factory.connect(asset, this.#provider)
    const allowance = await erc20.allowance(
      account,
      this.handlerContractAddress
    )
    if (allowance < amount) {
      return erc20.approve.populateTransaction(
        this.handlerContractAddress,
        amount
      )
    }
  }

  async getDeposit(
    asset: string,
    amount: bigint,
    recipient: string,
    solution: Solution
  ) {
    if (!this.client.validateSolution(solution)) {
      throw new Error('Solution is invalid')
    }
    const handler = Handler__factory.connect(
      this.handlerContractAddress,
      this.#provider
    )
    const id = generateId()
    await this.client.uploadSolution(id, $solution.encode(solution))
    const isNativeAsset = asset === this.nativeAsset
    const worker = (await this.client.getWorker()).account20
    const tx = await handler.deposit.populateTransaction(
      asset,
      amount,
      recipient,
      worker,
      id,
      {value: isNativeAsset ? amount : undefined}
    )
    return {id, tx}
  }
}
