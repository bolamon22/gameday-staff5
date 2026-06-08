import crypto from 'crypto'

const ALGO = 'aes-256-gcm'
const KEY_ENV = process.env.ENCRYPTION_KEY || 'gameday-staff-default-key-32chars!!'

function getKey(): Buffer {
  return crypto.createHash('sha256').update(KEY_ENV).digest()
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decrypt(ciphertext: string): string {
  try {
    const buf = Buffer.from(ciphertext, 'base64')
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const encrypted = buf.subarray(28)
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv)
    decipher.setAuthTag(tag)
    return decipher.update(encrypted) + decipher.final('utf8')
  } catch {
    // Fallback: maybe stored unencrypted (migration period)
    return ciphertext
  }
}

export function encryptConfig(config: Record<string, string>): string {
  return encrypt(JSON.stringify(config))
}

export function decryptConfig(stored: string): Record<string, string> {
  try {
    return JSON.parse(decrypt(stored))
  } catch {
    return {}
  }
}
