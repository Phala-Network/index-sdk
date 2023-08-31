import {
  CertificateData,
  OnChainRegistry,
  PinkContractPromise,
  options as phalaOptions,
  signCertificate,
} from '@phala/sdk'
import {ApiPromise, WsProvider} from '@polkadot/api'
import {Keyring} from '@polkadot/keyring'
import {KeyringPair} from '@polkadot/keyring/types'
import {EvmChain, PhalaChain} from './chain'
import abi from './executor.json'
import {createValidateFn} from './solution'
import {Chain, Hex, Task} from './types'

export enum Environment {
  MAINNET,
  TESTNET,
}

const rpcUrl: Record<Environment, string> = {
  [Environment.MAINNET]: 'wss://api.phala.network/ws',
  [Environment.TESTNET]: 'wss://poc5.phala.network/ws',
}

const contractId: Record<Environment, string> = {
  [Environment.MAINNET]:
    '0x271f04685ff7dfab0e08957a1dbbb1cbc205125e7a04a538be364535b8c449f9',
  [Environment.TESTNET]:
    '0x271f04685ff7dfab0e08957a1dbbb1cbc205125e7a04a538be364535b8c449f9',
}

export interface Options {
  environment: Environment
}

export class Executor {
  readonly #rpcUrl: string
  readonly #contractId: string
  readonly #api: ApiPromise
  #pair: KeyringPair | undefined
  #cert: CertificateData | undefined
  #contract: PinkContractPromise | undefined = undefined
  #initialized = false
  #chains: Chain[] = []
  #chainMap: Map<string, Chain> = new Map()
  #isReady: Promise<void>

  workers: Array<{account20: Hex; account32: Hex}> = []

  constructor(options: Options = {environment: Environment.MAINNET}) {
    this.#rpcUrl = rpcUrl[options.environment]
    this.#contractId = contractId[options.environment]
    this.#api = new ApiPromise(
      phalaOptions({provider: new WsProvider(this.#rpcUrl), noInitWarn: true})
    )

    this.#isReady = this.#initialize()
  }

  // TODO: use as decorator when esbuild is ready
  #requireReady() {
    if (this.initialized === false) {
      throw new Error('Executor is not ready')
    }
  }

  get initialized(): boolean {
    return this.#initialized
  }

  get chains(): Chain[] {
    return this.#chains
  }

  get isReady(): Promise<void> {
    return this.#isReady
  }

  #validateSolution: (solution: any) => boolean = () => false

  validateSolution(solution: any): boolean {
    this.#requireReady()
    return this.#validateSolution(solution)
  }

  async #initialize() {
    await this.#api.isReady
    const keyring = new Keyring({type: 'sr25519'})
    this.#pair = keyring.addFromUri('//Alice')
    const phatRegistry = await OnChainRegistry.create(this.#api)
    this.#cert = await signCertificate({pair: this.#pair})
    const contractKey = await phatRegistry.getContractKeyOrFail(
      this.#contractId
    )
    this.#contract = new PinkContractPromise(
      this.#api,
      phatRegistry,
      abi,
      this.#contractId,
      contractKey
    )
    {
      const {output} = await this.#contract.query.getRegistry(
        this.#pair.address,
        {cert: this.#cert}
      )
      if (output.isOk) {
        const registry = (output.asOk.toJSON() as any).ok
        if (Array.isArray(registry?.chains)) {
          this.#chains = registry.chains
        }
      }
      if (this.#chains.length === 0) {
        throw new Error('Get registry error')
      }
      this.#chainMap = new Map(this.#chains.map((chain) => [chain.name, chain]))
    }

    {
      const {output} = await this.#contract.query.getWorkerAccounts(
        this.#pair.address,
        {cert: this.#cert}
      )
      if (output.isOk) {
        const workers = (output.asOk.toJSON() as any).ok
        if (Array.isArray(workers)) {
          this.workers = workers
        }
      }
      if (this.workers.length === 0) {
        throw new Error('Get workers error')
      }
    }

    this.#validateSolution = createValidateFn(this.#chains)
    this.#initialized = true
  }

  createEvmChain(chainName: string) {
    this.#requireReady()
    const chain = this.#chainMap.get(chainName)
    if (chain == null || chain.chainType !== 'Evm') {
      throw new Error(`Chain ${chainName} is not supported`)
    }
    return new EvmChain(chain, this)
  }

  createPhalaChain(chainName: string) {
    this.#requireReady()
    const chain = this.#chainMap.get(chainName)
    if (chain == null) {
      throw new Error(`Chain ${chainName} is not supported`)
    }
    return new PhalaChain(chain, this)
  }

  async getTask(id: string) {
    this.#requireReady()
    // Passthrough type check
    if (this.#contract == null || this.#cert == null || this.#pair == null) {
      throw new Error()
    }
    const {output} = await this.#contract.query.getRunningTask(
      this.#pair.address,
      {cert: this.#cert},
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

  async getWorker() {
    this.#requireReady()
    // // Passthrough type check
    // if (this.#contract == null || this.#cert == null) {
    //   throw new Error()
    // }
    // const {output} = this.#contract.query.getFreeWorkerAccount(
    //   this.#pair.address,
    //   {cert: this.#cert}
    // )
    // const worker = this.workers[Math.floor(Math.random() * this.workers.length)]
    // return worker

    // TODO: remove hardcore worker
    return {
      account32:
        '0x04dba0677fc274ffaccc0fa1030a66b171d1da9226d2bb9d152654e6a746f276',
      account20: '0xbf526928373748b00763875448ee905367d97f96',
    }
  }
}
