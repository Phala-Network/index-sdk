import Ajv, {JSONSchemaType} from 'ajv'

const hexPattern = '^0x[0-9a-fA-F]+$'

export const createValidateFn = (chains: Chain[]) => {
  const ajv = new Ajv()
  const chainName = chains.map((c) => c.name)
  const solutionSchema: JSONSchemaType<Solution> = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        exe_type: {type: 'string', enum: ['bridge', 'swap']},
        exe: {type: 'string', minLength: 1},
        source_chain: {type: 'string', enum: chainName},
        dest_chain: {type: 'string', enum: chainName},
        spend_asset: {type: 'string', pattern: hexPattern},
        receive_asset: {type: 'string', pattern: hexPattern},
      },
      required: [
        'exe_type',
        'exe',
        'source_chain',
        'dest_chain',
        'spend_asset',
        'receive_asset',
      ],
      additionalProperties: false,
    },
    minItems: 1,
  }

  const validate = ajv.compile(solutionSchema)

  return (solution: any): boolean => {
    let isValid = validate(solution)

    for (let i = 0; isValid && i < solution.length; i++) {
      const {exe_type, source_chain, dest_chain, spend_asset, receive_asset} =
        solution[i]
      if (
        // source_chain and dest_chain must be different when exe_type is bridge
        (exe_type === 'bridge' && source_chain === dest_chain) ||
        // source_chain and dest_chain must be same when exe_type is swap
        (exe_type === 'swap' && source_chain !== dest_chain) ||
        // spend_asset and receive_asset must be different when exe_type is swap
        (exe_type === 'swap' && spend_asset === receive_asset) ||
        // source_chain must be same with dest_chain of previous step
        (i > 0 && source_chain !== solution[i - 1].dest_chain)
      ) {
        isValid = false
      }
    }
    return isValid
  }
}
