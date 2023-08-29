import {ApiPromise, WsProvider, Keyring} from '@polkadot/api'
import {
  options,
  OnChainRegistry,
  signCertificate,
  PinkContractPromise,
} from '@phala/sdk'
import abi from './executor_metadata.json'
import {createValidateFn} from './solution.js'

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
  #api: ApiPromise | undefined = undefined
  #initialized = false

  chains: Chain[] = []
  #chainMap: Map<string, Chain> = new Map()

  constructor(options: Options = {environment: Environment.MAINNET}) {
    this.#rpcUrl = rpcUrl[options.environment]
    this.#contractId = contractId[options.environment]
  }

  get initialized(): boolean {
    return this.#initialized
  }

  #checkInitialization() {
    if (!this.#initialized) {
      throw new Error('Executor must be initialized first')
    }
  }

  #validateSolution: (solution: any) => boolean = () => false

  async initialize() {
    if (this.#initialized) {
      throw new Error('Executor has already be initialized')
    }
    this.#api = await ApiPromise.create(
      options({provider: new WsProvider(this.#rpcUrl), noInitWarn: true})
    )
    const phatRegistry = await OnChainRegistry.create(this.#api)
    const keyring = new Keyring({type: 'sr25519'})
    const pair = keyring.addFromUri('//Alice')
    const cert = await signCertificate({pair})
    const contractKey = await phatRegistry.getContractKeyOrFail(
      this.#contractId
    )
    const contract = new PinkContractPromise(
      this.#api,
      phatRegistry,
      abi,
      this.#contractId,
      contractKey
    )
    const {output} = await contract.query.getRegistry(pair.address, {cert})
    if (output.isOk) {
      const registry = output.asOk.toJSON() as
        | {ok: {chains: Chain[]}}
        | null
        | undefined
      if (registry != null) {
        this.chains = registry.ok.chains
        this.#chainMap = new Map(
          this.chains.map((chain) => [chain.name, chain])
        )
      }
    }
    if (this.chains.length === 0) {
      throw new Error('Get registry error')
    }
    this.#validateSolution = createValidateFn(this.chains)
    this.#initialized = true
  }

  async createChain(chainName: string) {
    this.#checkInitialization()
    const chain = this.#chainMap.get(chainName)
    if (chain == null) {
      throw new Error(`Chain ${chainName} is not found in registry`)
    }
  }
}
