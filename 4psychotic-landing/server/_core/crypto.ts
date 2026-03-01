import crypto from 'crypto';
import { ENV } from './env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Derive encryption key from JWT secret
 */
function getKey(): Buffer {
  return crypto
    .createHash('sha256')
    .update(ENV.cookieSecret || 'default-secret-change-in-production')
    .digest();
}

/**
 * Encrypt sensitive data (tokens)
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty');
  }

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(salt);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Combine salt + iv + tag + encrypted
  return Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]).toString('base64');
}

/**
 * Decrypt sensitive data (tokens)
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Encrypted data cannot be empty');
  }

  try {
    const data = Buffer.from(encryptedData, 'base64');
    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, TAG_POSITION);
    const tag = data.subarray(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = data.subarray(ENCRYPTED_POSITION);

    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(salt);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}
