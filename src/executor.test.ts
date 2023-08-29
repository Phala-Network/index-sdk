import {Environment, Executor} from './executor.js'
import {expect, test} from 'vitest'

test(
  'Executor initialization',
  async () => {
    const executor = new Executor({environment: Environment.TESTNET})
    await executor.initialize()

    expect(executor.initialized).toBe(true)
  },
  {timeout: 10_000}
)
