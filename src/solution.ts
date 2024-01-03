import {u8aToHex} from '@polkadot/util'
import Ajv, {JSONSchemaType} from 'ajv'
import * as $ from 'subshape'
import {Chain, Hex, Solution, Step} from './types'
import {Client} from './client'

const $single = $.object(
  $.field('exe', $.str),
  $.field('sourceChain', $.str),
  $.field('destChain', $.str),
  $.field('spendAsset', $.str),
  $.field('receiveAsset', $.str),
  $.field('recipient', $.str)
)

interface StepWithRecipient extends Step {
  recipient: string
}

const $batch = $.array($single)

interface Single extends StepWithRecipient {
  _tag: 'single'
}

class Batch extends Array<StepWithRecipient> {
  _tag = 'batch' as const
}

const $multiStep = $.taggedUnion('_tag', [
  $.variant('single', $single),
  $.variant('batch', $batch),
])

export const $solution = $.array($multiStep)

export const processSolution = (
  client: Client,
  solution: Solution,
  recipient: string
): Hex => {
  const mergedSteps: Array<Single | Batch> = []
  let batch: Batch = new Batch()
  const chainMap = client.chainMap
  const workerAccountInfo = client.getWorker()

  const pushSingleOrBatch = (item: StepWithRecipient | Batch) => {
    if (Array.isArray(item)) {
      if (item.length === 0) return
      if (item.length === 1) {
        item = item[0]
      } else {
        mergedSteps.push(item)
        return
      }
    }
    mergedSteps.push({_tag: 'single', ...item})
  }

  for (let i = 0; i < solution.length; i++) {
    let stepRecipient: string
    const step = solution[i]
    const sourceChain = chainMap.get(step.sourceChain) as Chain
    const destChain = chainMap.get(step.destChain) as Chain
    const isBridge = step.sourceChain !== step.destChain
    const isFromEvm = sourceChain.chainType === 'Evm'
    const isToEvm = destChain.chainType === 'Evm'

    if (i === solution.length - 1) {
      stepRecipient = recipient
    } else if (isBridge) {
      stepRecipient = workerAccountInfo[isToEvm ? 'account20' : 'account32']
    } else {
      stepRecipient = destChain.handlerContract
    }
    const stepWithRecipient: StepWithRecipient = {
      ...step,
      recipient: stepRecipient,
    }

    const isSameChain =
      batch.length > 0 &&
      step.sourceChain === batch[batch.length - 1].sourceChain

    if (isFromEvm && (batch.length === 0 || isSameChain)) {
      batch.push(stepWithRecipient)
    } else {
      pushSingleOrBatch(batch)
      batch = new Batch()
      if (isFromEvm) {
        batch.push(stepWithRecipient)
      } else {
        pushSingleOrBatch(stepWithRecipient)
      }
    }
  }

  pushSingleOrBatch(batch)

  return u8aToHex($solution.encode(mergedSteps))
}

const hexPattern = '^0x[0-9a-fA-F]+$'

export const createValidateFn = (chains: Chain[]) => {
  const ajv = new Ajv()
  const chainName = chains.map((c) => c.name)
  const solutionSchema: JSONSchemaType<Solution> = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        exe: {type: 'string', minLength: 1},
        sourceChain: {type: 'string', enum: chainName},
        destChain: {type: 'string', enum: chainName},
        spendAsset: {type: 'string', pattern: hexPattern},
        receiveAsset: {type: 'string', pattern: hexPattern},
      },
      required: [
        'exe',
        'sourceChain',
        'destChain',
        'spendAsset',
        'receiveAsset',
      ],
      additionalProperties: false,
    },
    minItems: 1,
  }

  const validate = ajv.compile(solutionSchema)

  return (solution: any): boolean => {
    let isValid = validate(solution)

    for (let i = 0; isValid && i < solution.length; i++) {
      const {sourceChain, destChain, spendAsset, receiveAsset} = solution[i]
      const isSwap = sourceChain === destChain
      if (
        // spendAsset and receiveAsset must be different when is swap
        (isSwap && spendAsset === receiveAsset) ||
        // sourceChain must be same with destChain of previous step
        (i > 0 && sourceChain !== solution[i - 1].destChain)
      ) {
        isValid = false
      }
    }
    return isValid
  }
}
