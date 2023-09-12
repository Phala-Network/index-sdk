import {Hex} from './types'

function u8aToHex(u8a: Uint8Array): Hex {
  return `0x${Array.from(u8a, (x) => x.toString(16).padStart(2, '0')).join('')}`
}

export function generateId(length = 32): Hex {
  const array = new Uint8Array(length)
  const crypto =
    typeof window === 'undefined' ? require('crypto').webcrypto : window.crypto
  crypto.getRandomValues(array)
  return u8aToHex(array)
}
