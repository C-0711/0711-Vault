/**
 * 0711 Vault Chat E2EE Crypto Library
 * 
 * Uses @noble/curves for X25519 (key exchange) and Ed25519 (signing)
 * Uses @noble/ciphers for XChaCha20-Poly1305 (encryption)
 * Uses @noble/hashes for key derivation
 */

import { x25519, ed25519 } from '@noble/curves/ed25519.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { randomBytes } from '@noble/ciphers/utils.js';

// Constants
const NONCE_LENGTH = 24; // XChaCha20 uses 24-byte nonce
const KEY_LENGTH = 32;

/**
 * Generate a new X25519 keypair for encryption
 */
export function generateEncryptionKeypair() {
  const privateKey = x25519.utils.randomPrivateKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return {
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey),
  };
}

/**
 * Generate a new Ed25519 keypair for signing
 */
export function generateSigningKeypair() {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return {
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey),
  };
}

/**
 * Perform X25519 ECDH to derive a shared secret
 */
export function deriveSharedSecret(myPrivateKey, theirPublicKey) {
  const shared = x25519.getSharedSecret(
    hexToBytes(myPrivateKey),
    hexToBytes(theirPublicKey)
  );
  return bytesToHex(shared);
}

/**
 * Derive an encryption key from shared secret using HKDF
 */
export function deriveEncryptionKey(sharedSecret, context = 'vault-chat') {
  const key = hkdf(sha256, hexToBytes(sharedSecret), undefined, context, KEY_LENGTH);
  return bytesToHex(key);
}

/**
 * Encrypt a message using XChaCha20-Poly1305
 */
export function encryptChat(plaintext, keyHex) {
  const key = hexToBytes(keyHex);
  const nonce = randomBytes(NONCE_LENGTH);
  const data = new TextEncoder().encode(plaintext);
  
  const cipher = xchacha20poly1305(key, nonce);
  const ciphertext = cipher.encrypt(data);
  
  // Prepend nonce to ciphertext
  const result = new Uint8Array(nonce.length + ciphertext.length);
  result.set(nonce);
  result.set(ciphertext, nonce.length);
  
  return bytesToHex(result);
}

/**
 * Decrypt a message using XChaCha20-Poly1305
 */
export function decryptChat(encryptedHex, keyHex) {
  const key = hexToBytes(keyHex);
  const data = hexToBytes(encryptedHex);
  
  // Extract nonce and ciphertext
  const nonce = data.slice(0, NONCE_LENGTH);
  const ciphertext = data.slice(NONCE_LENGTH);
  
  const cipher = xchacha20poly1305(key, nonce);
  const plaintext = cipher.decrypt(ciphertext);
  
  return new TextDecoder().decode(plaintext);
}

/**
 * Sign a message using Ed25519
 */
export function signMessage(message, privateKeyHex) {
  const data = typeof message === 'string' 
    ? new TextEncoder().encode(message) 
    : message;
  const signature = ed25519.sign(data, hexToBytes(privateKeyHex));
  return bytesToHex(signature);
}

/**
 * Verify a signature using Ed25519
 */
export function verifySignature(message, signatureHex, publicKeyHex) {
  const data = typeof message === 'string' 
    ? new TextEncoder().encode(message) 
    : message;
  return ed25519.verify(
    hexToBytes(signatureHex),
    data,
    hexToBytes(publicKeyHex)
  );
}

/**
 * Encrypt a conversation key for a recipient
 */
export function encryptKeyForRecipient(conversationKey, myPrivateKey, theirPublicKey) {
  const sharedSecret = deriveSharedSecret(myPrivateKey, theirPublicKey);
  const encryptionKey = deriveEncryptionKey(sharedSecret, 'vault-key-wrap');
  return encryptChat(conversationKey, encryptionKey);
}

/**
 * Decrypt a conversation key from sender
 */
export function decryptKeyFromSender(encryptedKey, myPrivateKey, theirPublicKey) {
  const sharedSecret = deriveSharedSecret(myPrivateKey, theirPublicKey);
  const encryptionKey = deriveEncryptionKey(sharedSecret, 'vault-key-wrap');
  return decryptChat(encryptedKey, encryptionKey);
}

/**
 * Generate a random conversation key
 */
export function generateConversationKey() {
  return bytesToHex(randomBytes(KEY_LENGTH));
}

// === Key Storage (IndexedDB) ===

const DB_NAME = 'vault_chat_keys';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

let dbPromise = null;

function getDB() {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
  
  return dbPromise;
}

/**
 * Store keys in IndexedDB (encrypted with user's master key)
 */
export async function storeKeys(userId, keys, masterKey) {
  const db = await getDB();
  const encrypted = encryptChat(JSON.stringify(keys), masterKey);
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put({ id: userId, data: encrypted });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load keys from IndexedDB
 */
export async function loadKeys(userId, masterKey) {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(userId);
    
    request.onsuccess = () => {
      if (!request.result) {
        resolve(null);
        return;
      }
      try {
        const decrypted = decryptChat(request.result.data, masterKey);
        resolve(JSON.parse(decrypted));
      } catch (e) {
        reject(new Error('Failed to decrypt keys'));
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Initialize or load user keys
 */
export async function initializeChatKeys(userId, masterKey) {
  let keys = null;
  
  try {
    keys = await loadKeys(userId, masterKey);
  } catch {
    // Keys don't exist or failed to decrypt, generate new ones
  }
  
  if (!keys) {
    // Generate new keypairs
    keys = {
      encryption: generateEncryptionKeypair(),
      signing: generateSigningKeypair(),
      conversationKeys: {}, // conversation_id -> key
    };
    await storeKeys(userId, keys, masterKey);
  }
  
  return keys;
}

/**
 * Store a conversation key
 */
export async function storeConversationKey(userId, conversationId, key, masterKey) {
  const keys = await loadKeys(userId, masterKey);
  if (!keys) throw new Error('Keys not initialized');
  
  keys.conversationKeys[conversationId] = key;
  await storeKeys(userId, keys, masterKey);
}

/**
 * Get a conversation key
 */
export async function getConversationKey(userId, conversationId, masterKey) {
  const keys = await loadKeys(userId, masterKey);
  return keys?.conversationKeys?.[conversationId] || null;
}

// === Utility Functions ===

export function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export default {
  generateEncryptionKeypair,
  generateSigningKeypair,
  deriveSharedSecret,
  deriveEncryptionKey,
  encryptChat,
  decryptChat,
  signMessage,
  verifySignature,
  encryptKeyForRecipient,
  decryptKeyFromSender,
  generateConversationKey,
  initializeChatKeys,
  storeConversationKey,
  getConversationKey,
  bytesToHex,
  hexToBytes,
};
