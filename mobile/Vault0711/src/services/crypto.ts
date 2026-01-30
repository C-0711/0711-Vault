/**
 * 0711 Vault Crypto Service
 * React Native encryption using expo-crypto
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// Convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a random salt
 */
export function generateSalt(): string {
  const salt = Crypto.getRandomBytes(32);
  return bytesToHex(new Uint8Array(salt));
}

/**
 * Derive auth hash from password using SHA-512
 * Note: In production, use proper PBKDF2
 */
export async function deriveKeys(password: string, salt: string): Promise<{
  authHash: string;
  encryptionKey: string;
}> {
  // Simple derivation for demo - in production use proper PBKDF2
  const combined = password + salt;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA512,
    combined
  );
  
  return {
    authHash: hash.substring(0, 64),
    encryptionKey: hash.substring(64),
  };
}

/**
 * Generate a random master key
 */
export function generateMasterKey(): string {
  const key = Crypto.getRandomBytes(32);
  return bytesToHex(new Uint8Array(key));
}

/**
 * Encrypt master key (simple XOR for demo - use proper AES in production)
 */
export async function encryptMasterKey(
  masterKey: string,
  encryptionKey: string
): Promise<string> {
  const mkBytes = hexToBytes(masterKey);
  const ekBytes = hexToBytes(encryptionKey);
  const result = new Uint8Array(mkBytes.length);
  
  for (let i = 0; i < mkBytes.length; i++) {
    result[i] = mkBytes[i] ^ ekBytes[i % ekBytes.length];
  }
  
  return bytesToHex(result);
}

/**
 * Decrypt master key
 */
export async function decryptMasterKey(
  encryptedMasterKey: string,
  encryptionKey: string
): Promise<string> {
  // XOR is symmetric
  return encryptMasterKey(encryptedMasterKey, encryptionKey);
}

/**
 * Store master key securely
 */
export async function storeMasterKey(masterKey: string): Promise<void> {
  await SecureStore.setItemAsync('vault_master_key', masterKey);
}

/**
 * Get master key from secure storage
 */
export async function getMasterKey(): Promise<string | null> {
  return SecureStore.getItemAsync('vault_master_key');
}

/**
 * Clear master key from secure storage
 */
export async function clearMasterKey(): Promise<void> {
  await SecureStore.deleteItemAsync('vault_master_key');
}

/**
 * Encrypt text (simple for demo)
 */
export async function encrypt(text: string, masterKey: string): Promise<string> {
  const textBytes = new TextEncoder().encode(text);
  const keyBytes = hexToBytes(masterKey);
  const result = new Uint8Array(textBytes.length);
  
  for (let i = 0; i < textBytes.length; i++) {
    result[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return bytesToHex(result);
}

/**
 * Decrypt text
 */
export async function decrypt(encrypted: string, masterKey: string): Promise<string> {
  const encBytes = hexToBytes(encrypted);
  const keyBytes = hexToBytes(masterKey);
  const result = new Uint8Array(encBytes.length);
  
  for (let i = 0; i < encBytes.length; i++) {
    result[i] = encBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return new TextDecoder().decode(result);
}

export default {
  generateSalt,
  deriveKeys,
  generateMasterKey,
  encryptMasterKey,
  decryptMasterKey,
  storeMasterKey,
  getMasterKey,
  clearMasterKey,
  encrypt,
  decrypt,
};
