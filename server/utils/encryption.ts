import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

const algorithm = 'aes-256-gcm'
const password = process.env.NUXT_SESSION_PASSWORD || 'default-secret-do-not-use-in-production'
// Derive a 32-byte key from the password
const key = scryptSync(password, 'salt', 32)

export function encrypt(text: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  // Return IV:AuthTag:EncryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decrypt(hash: string): string {
  const [ivHex, authTagHex, encryptedText] = hash.split(':')
  if (!ivHex || !authTagHex || !encryptedText) {
    return hash // Return as is if not in expected format (maybe already decrypted or legacy)
  }

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
