import Ajv, {JSONSchemaType} from 'ajv'
import * as $ from 'subshape'
import {Chain, Solution} from './types'

export const $solution = $.array(
  $.object(
    $.field('exe', $.str),
    $.field('sourceChain', $.str),
    $.field('destChain', $.str),
    $.field('spendAsset', $.str),
    $.field('receiveAsset', $.str)
  )
)

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
