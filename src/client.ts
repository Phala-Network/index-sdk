import {
  CertificateData,
  OnChainRegistry,
  PinkContractPromise,
  options as phalaOptions,
  signCertificate,
} from '@phala/sdk'
import {ApiPromise, HttpProvider, WsProvider} from '@polkadot/api'
import {Keyring} from '@polkadot/keyring'
import {KeyringPair} from '@polkadot/keyring/types'
import {hexToU8a} from '@polkadot/util'
import {EvmChain, PhalaChain} from './chain'
import abi from './index_executor.json'
import {$solution, createValidateFn, processSolution} from './solution'
import {Chain, Solution, Task, Worker} from './types'

export enum Environment {
  MAINNET,
  TESTNET,
}

const rpcUrl: Record<Environment, string> = {
  [Environment.MAINNET]: 'https://api.phala.network/ws',
  [Environment.TESTNET]: 'https://poc6.phala.network/ws',
}

const contractId: Record<Environment, string> = {
  [Environment.MAINNET]:
    '0x271f04685ff7dfab0e08957a1dbbb1cbc205125e7a04a538be364535b8c449f9',
  [Environment.TESTNET]:
    '0x61781c26e8e6d8d4ba96f1d9b817f721baedd0741e72c595699095ee81476180',
}

export interface TaskSimulateResult {
  actionExtraInfo: {
    extraProtoFeeInUsd: number
    constProtoFeeInUsd: number
    percentageProtoFee: number
    confirmTimeInSec: number
  }
  gasLimit: string | null
  gasPrice: string | null
  nativePriceInUsd: number
  txFeeInUsd: number
}

export interface Options {
  environment?: Environment
  overrides?: {
    endpoint?: string
    contractId?: string
  }
}

export class Client {
  private readonly endpoint: string
  private readonly contractId: string
  private readonly api: ApiPromise
  readonly isReady: Promise<this>
  pair: KeyringPair | undefined
  cert: CertificateData | undefined
  contract: PinkContractPromise | undefined
  initialized = false
  chains: Chain[] = []
  chainMap: Map<string, Chain> = new Map()
  workers: Worker[] = []

  constructor(options?: Options) {
    const environment = options?.environment ?? Environment.MAINNET
    this.endpoint = options?.overrides?.endpoint ?? rpcUrl[environment]
    this.contractId = options?.overrides?.contractId ?? contractId[environment]
    const Provider = this.endpoint.startsWith('http')
      ? HttpProvider
      : WsProvider
    this.api = new ApiPromise(
      phalaOptions({provider: new Provider(this.endpoint), noInitWarn: true})
    )

    this.isReady = this.initialize()
  }

  // TODO: use as decorator when esbuild is ready
  private assertReady(): asserts this is {
    pair: KeyringPair
    cert: CertificateData
    contract: PinkContractPromise
    initialized: true
  } {
    if (this.initialized === false) {
      throw new Error('Client is not ready')
    }
  }

  validateSolution: (solution: any) => boolean = () => {
    this.assertReady()
    return false
  }

  async uploadSolution(taskId: string, solution: Solution, recipient: string) {
    this.assertReady()
    const {output} = await this.contract.query.uploadSolution(
      this.pair.address,
      {cert: this.cert},
      taskId,
      processSolution(this, solution, recipient)
    )
    if (!output.isOk || output.asOk.toString() !== 'Ok') {
      throw new Error(`Failed to upload solution: ${output.asOk.toString()}`)
    }
  }

  async getSolution(taskId: string) {
    this.assertReady()
    const {output} = await this.contract.query.getSolution(
      this.pair.address,
      {cert: this.cert},
      taskId
    )
    let solution
    if (output.isOk) {
      try {
        solution = $solution.decode(hexToU8a((output.asOk.toJSON() as any).ok))
      } catch (err) {}
    }
    if (solution == null) {
      throw new Error(`Failed to get solution`)
    }

    return solution
  }

  async simulateSolution(solution: Solution, recipient: string) {
    this.assertReady()
    const {output} = await this.contract.query.simulateSolution(
      this.pair.address,
      {cert: this.cert},
      this.getWorker().account32,
      processSolution(this, solution, recipient)
    )
    let results
    if (output.isOk) {
      try {
        return (output.asOk.toJSON() as any).ok as TaskSimulateResult[]
      } catch (err) {}
    }
    if (results == null) {
      throw new Error(`Failed to simulate solution`)
    }
  }

  async initialize() {
    await this.api.isReady
    const keyring = new Keyring({type: 'sr25519'})
    this.pair = keyring.addFromUri('//Alice')
    const phatRegistry = await OnChainRegistry.create(this.api)
    this.cert = await signCertificate({pair: this.pair})
    const contractKey = await phatRegistry.getContractKeyOrFail(this.contractId)
    this.contract = new PinkContractPromise(
      this.api,
      phatRegistry,
      abi,
      this.contractId,
      contractKey
    )

    {
      const {output} = await this.contract.query.getRegistry(
        this.pair.address,
        {cert: this.cert}
      )
      if (output.isOk) {
        const registry = (output.asOk.toJSON() as any).ok
        if (Array.isArray(registry?.chains)) {
          this.chains = registry.chains
        }
      }
      if (this.chains.length === 0) {
        throw new Error('Get registry error')
      }
      this.chainMap = new Map(this.chains.map((chain) => [chain.name, chain]))
    }

    // {
    //   const {output} = await this.contract.query.getWorkerAccounts(
    //     this.pair.address,
    //     {cert: this.cert}
    //   )
    //   if (output.isOk) {
    //     const workers = (output.asOk.toJSON() as any).ok
    //     if (Array.isArray(workers)) {
    //       this.workers = workers
    //     }
    //   }
    //   if (this.workers.length === 0) {
    //     throw new Error('Get workers error')
    //   }
    // }

    this.validateSolution = createValidateFn(this.chains)
    this.initialized = true

    return this
  }

  createEvmChain(chainName: string) {
    this.assertReady()
    const chain = this.chainMap.get(chainName)
    if (chain == null || chain.chainType !== 'Evm') {
      throw new Error(`Chain ${chainName} is not supported`)
    }
    return new EvmChain(chain, this)
  }

  createPhalaChain(chainName: string) {
    this.assertReady()
    const chain = this.chainMap.get(chainName)
    if (chain == null) {
      throw new Error(`Chain ${chainName} is not supported`)
    }
    return new PhalaChain(chain, this)
  }

  async getTask(id: string) {
    this.assertReady()
    const {output} = await this.contract.query.getTask(
      this.pair.address,
      {cert: this.cert},
      id
    )

    let task: Task | undefined
    if (output.isOk) {
      // FIXME: extract task from output
      task = (output.asOk.toJSON() as any).ok as Task
    }

    if (task == null) {
      throw new Error('Get task failed')
    }

    return task
  }

  getWorker(): Worker {
    this.assertReady()
    // const {output} = this.contract.query.getFreeWorkerAccount(
    //   this.pair.address,
    //   {cert: this.cert}
    // )
    // const worker = this.workers[Math.floor(Math.random() * this.workers.length)]
    // return worker

    // TODO: remove hardcore worker
    return {
      account32:
        '0x641017970d80738617e4e9b9b01d8d2ed5bc3d881a60e5105620abfbf5cb1331',
      account20: '0x5cddb3ad187065e0122f3f46d13ad6ca486e4644',
    }
  }
}
