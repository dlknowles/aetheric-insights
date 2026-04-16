// src/lib/crypto/browser.ts

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const DERIVATION_ALGORITHM = 'PBKDF2';
const KEY_LENGTH = 256;
const ITERATIONS = 100000;

// Helper to convert strings to ArrayBuffers
const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * Derives a cryptographic key from a password and a salt using PBKDF2.
 */
export async function deriveKey(password: string, saltHex: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: DERIVATION_ALGORITHM },
    false,
    ['deriveBits', 'deriveKey']
  );
  const saltBuffer = Uint8Array.from(Buffer.from(saltHex, 'hex'));

  return crypto.subtle.deriveKey(
    {
      name: DERIVATION_ALGORITHM,
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plaintext using AES-GCM.
 * Returns the ciphertext and the IV used, both as hex strings.
 */
export async function encryptData(plaintext: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));  
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: iv
    },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: Buffer.from(encryptedBuffer).toString('hex'),
    iv: Buffer.from(iv).toString('hex')
  };
}

/**
 * Decrypts AES-GCM ciphertext using the provided IV.
 */
export async function decryptData(ciphertextHex: string, ivHex: string, key: CryptoKey): Promise<string> {
  const ciphertextBuffer = Uint8Array.from(Buffer.from(ciphertextHex, 'hex'));
  const ivBuffer = Uint8Array.from(Buffer.from(ivHex, 'hex'));
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: ivBuffer
    },
    key,
    ciphertextBuffer
  );

  return dec.decode(decryptedBuffer);
}

/**
 * Generates a random salt for new users using pure Web Crypto APIs.
 */
export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}