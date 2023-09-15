import {u8aToHex} from '@polkadot/util'
import {Hex} from './types'

export function generateId(length = 32): Hex {
  const array = new Uint8Array(length)
  const crypto =
    typeof window === 'undefined' ? require('crypto').webcrypto : window.crypto
  crypto.getRandomValues(array)
  return u8aToHex(array)
}
