/**
 * 0711 Vault Client-Side Cryptography
 * Zero-knowledge encryption - keys never leave the client
 */

// Convert string to ArrayBuffer
function str2ab(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// Convert ArrayBuffer to hex string
function ab2hex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert hex string to ArrayBuffer
function hex2ab(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}

// Convert ArrayBuffer to base64
function ab2b64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 to ArrayBuffer
function b642ab(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a random salt
 */
export function generateSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  return ab2hex(salt);
}

/**
 * Derive key from password using PBKDF2
 */
async function deriveKey(password, salt, iterations = 100000) {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    str2ab(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hex2ab(salt),
      iterations,
      hash: 'SHA-512',
    },
    passwordKey,
    512 // 64 bytes = 32 for auth + 32 for encryption
  );

  return new Uint8Array(derivedBits);
}

/**
 * Derive auth hash (for server verification) and encryption key from password
 */
export async function deriveKeys(password, salt) {
  const derivedBits = await deriveKey(password, salt);
  
  // First 32 bytes for auth hash (sent to server)
  const authKey = derivedBits.slice(0, 32);
  
  // Last 32 bytes for encryption (never sent to server)
  const encryptionKey = derivedBits.slice(32, 64);

  return {
    authHash: ab2hex(authKey),
    encryptionKey: ab2hex(encryptionKey),
  };
}

/**
 * Generate a random master key
 */
export function generateMasterKey() {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return ab2hex(key);
}

/**
 * Encrypt the master key with the user's encryption key
 */
export async function encryptMasterKey(masterKey, encryptionKey) {
  const key = await crypto.subtle.importKey(
    'raw',
    hex2ab(encryptionKey),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    hex2ab(masterKey)
  );

  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return ab2b64(combined);
}

/**
 * Decrypt the master key with the user's encryption key
 */
export async function decryptMasterKey(encryptedMasterKey, encryptionKey) {
  const combined = new Uint8Array(b642ab(encryptedMasterKey));
  
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const key = await crypto.subtle.importKey(
    'raw',
    hex2ab(encryptionKey),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return ab2hex(decrypted);
}

/**
 * Encrypt data with the master key
 */
export async function encrypt(data, masterKey) {
  const key = await crypto.subtle.importKey(
    'raw',
    hex2ab(masterKey),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = typeof data === 'string' ? str2ab(data) : data;
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return ab2b64(combined);
}

/**
 * Decrypt data with the master key
 */
export async function decrypt(encryptedData, masterKey) {
  const combined = new Uint8Array(b642ab(encryptedData));
  
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const key = await crypto.subtle.importKey(
    'raw',
    hex2ab(masterKey),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Encrypt a file with the master key
 */
export async function encryptFile(file, masterKey) {
  const arrayBuffer = await file.arrayBuffer();
  const key = await crypto.subtle.importKey(
    'raw',
    hex2ab(masterKey),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    arrayBuffer
  );

  // Combine IV + ciphertext into a new Blob
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return new Blob([combined], { type: 'application/octet-stream' });
}

/**
 * Decrypt a file with the master key
 */
export async function decryptFile(encryptedBlob, masterKey, originalType) {
  const arrayBuffer = await encryptedBlob.arrayBuffer();
  const combined = new Uint8Array(arrayBuffer);
  
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const key = await crypto.subtle.importKey(
    'raw',
    hex2ab(masterKey),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new Blob([decrypted], { type: originalType });
}

/**
 * Store master key securely in session
 */
export function storeMasterKey(masterKey) {
  sessionStorage.setItem('vault_master_key', masterKey);
}

/**
 * Get master key from session
 */
export function getMasterKey() {
  return sessionStorage.getItem('vault_master_key');
}

/**
 * Clear master key from session
 */
export function clearMasterKey() {
  sessionStorage.removeItem('vault_master_key');
}

export default {
  generateSalt,
  deriveKeys,
  generateMasterKey,
  encryptMasterKey,
  decryptMasterKey,
  encrypt,
  decrypt,
  encryptFile,
  decryptFile,
  storeMasterKey,
  getMasterKey,
  clearMasterKey,
};
