import {u8aToHex} from '@polkadot/util'
import Ajv, {JSONSchemaType} from 'ajv'
import * as $ from 'subshape'
import {Chain, Hex, Solution, Step} from './types'

const $single = $.object(
  $.field('exe', $.str),
  $.field('sourceChain', $.str),
  $.field('destChain', $.str),
  $.field('spendAsset', $.str),
  $.field('receiveAsset', $.str)
)

const $batch = $.array($single)

interface Single extends Step {
  _tag: 'single'
}

class Batch extends Array<Step> {
  _tag = 'batch' as const
}

const $multiStep = $.taggedUnion('_tag', [
  $.variant('single', $single),
  $.variant('batch', $batch),
])

const $legacySolution = $.array($single)

const $solution = $.array($multiStep)

export const processSolution = (
  chainMap: Map<string, Chain>,
  solution: Solution
): Hex => {
  // FIXME: remove legacy solution when https://github.com/Phala-Network/index-contract/pull/92 is merged
  return u8aToHex($legacySolution.encode(solution))
  // const mergedSteps: Array<Single | Batch> = []
  // let batch: Batch = new Batch()

  // const pushSingleOrBatch = (item: Step | Batch) => {
  //   if (Array.isArray(item)) {
  //     if (item.length === 0) return
  //     if (item.length === 1) {
  //       item = item[0]
  //     } else {
  //       mergedSteps.push(item)
  //       return
  //     }
  //   }
  //   mergedSteps.push({_tag: 'single', ...item})
  // }

  // for (const step of solution) {
  //   const chain = chainMap.get(step.sourceChain) as Chain

  //   const isEvm = chain.chainType === 'Evm'
  //   const isSameChain =
  //     batch.length > 0 &&
  //     step.sourceChain === batch[batch.length - 1].sourceChain

  //   if (isEvm && (batch.length === 0 || isSameChain)) {
  //     batch.push(step)
  //   } else {
  //     pushSingleOrBatch(batch)
  //     batch = new Batch()
  //     if (isEvm) {
  //       batch.push(step)
  //     } else {
  //       pushSingleOrBatch(step)
  //     }
  //   }
  // }

  // pushSingleOrBatch(batch)

  // return u8aToHex($solution.encode(mergedSteps))
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
