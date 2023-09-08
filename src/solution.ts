import Ajv, {JSONSchemaType} from 'ajv'
import {Chain, Solution} from './types'
import * as $ from 'subshape'

const $solution = $.array(
  $.object(
    $.field('exeType', $.str),
    $.field('exe', $.str),
    $.field('sourceChain', $.str),
    $.field('destChain', $.str),
    $.field('spendAsset', $.str),
    $.field('receiveAsset', $.str)
  )
)

export const encodeSolution = (solution: Solution): Uint8Array =>
  $solution.encode(solution)

const hexPattern = '^0x[0-9a-fA-F]+$'

export const createValidateFn = (chains: Chain[]) => {
  const ajv = new Ajv()
  const chainName = chains.map((c) => c.name)
  const solutionSchema: JSONSchemaType<Solution> = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        exeType: {type: 'string', enum: ['bridge', 'swap']},
        exe: {type: 'string', minLength: 1},
        sourceChain: {type: 'string', enum: chainName},
        destChain: {type: 'string', enum: chainName},
        spendAsset: {type: 'string', pattern: hexPattern},
        receiveAsset: {type: 'string', pattern: hexPattern},
      },
      required: [
        'exeType',
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
      const {exeType, sourceChain, destChain, spendAsset, receiveAsset} =
        solution[i]
      if (
        // sourceChain and destChain must be different when exe_type is bridge
        (exeType === 'bridge' && sourceChain === destChain) ||
        // sourceChain and destChain must be same when exe_type is swap
        (exeType === 'swap' && sourceChain !== destChain) ||
        // spendAsset and receiveAsset must be different when exe_type is swap
        (exeType === 'swap' && spendAsset === receiveAsset) ||
        // sourceChain must be same with destChain of previous step
        (i > 0 && sourceChain !== solution[i - 1].destChain)
      ) {
        isValid = false
      }
    }
    return isValid
  }
}
