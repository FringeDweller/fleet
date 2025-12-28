import { describe, expect, it } from 'vitest'
import { decrypt, encrypt } from '../../server/utils/encryption'

describe('Encryption Utility', () => {
  it('should encrypt and decrypt correctly', () => {
    const text = 'Hello, Fleet!'
    const encrypted = encrypt(text)
    expect(encrypted).not.toBe(text)
    expect(encrypted.split(':')).toHaveLength(3)

    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(text)
  })

  it('should return original text if format is invalid for decryption', () => {
    const invalidHash = 'invalid-hash'
    const result = decrypt(invalidHash)
    expect(result).toBe(invalidHash)
  })

  it('should work with empty strings', () => {
    const text = ''
    const encrypted = encrypt(text)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(text)
  })

  it('should work with long strings', () => {
    const text = 'A'.repeat(1000)
    const encrypted = encrypt(text)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(text)
  })
})
