import {Hex} from './types'
import crypto from 'crypto'

export function generateId(length = 32): Hex {
  const bytes = crypto.randomBytes(length)
  return `0x${bytes.toString('hex')}`
}
