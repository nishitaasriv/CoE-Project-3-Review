/**
 * Web Crypto API PBKDF2 password hashing with random salt.
 * Stores salt, iterations and hash as base64 strings.
 * Never stores or logs the plain password.
 */

export function isWebCryptoAvailable(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof crypto.subtle.importKey === 'function' &&
    typeof crypto.subtle.deriveBits === 'function'
  );
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time comparison between two strings of equal length to protect against timing attacks.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function hashPassword(
  password: string,
  existingSaltBase64?: string,
  iterations = 100000
): Promise<{
  hashBase64: string;
  saltBase64: string;
  hashHex?: string;
  saltHex?: string;
  iterations: number;
}> {
  if (!isWebCryptoAvailable()) {
    throw new Error('Web Crypto API is not available on this browser or origin.');
  }

  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password), // Do not trim or alter password!
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  let saltBytes: Uint8Array;
  if (existingSaltBase64) {
    // Check if base64 or legacy hex
    if (/^[0-9a-fA-F]{32,}$/.test(existingSaltBase64)) {
      saltBytes = hexToBytes(existingSaltBase64);
    } else {
      saltBytes = base64ToBytes(existingSaltBase64);
    }
  } else {
    saltBytes = crypto.getRandomValues(new Uint8Array(16));
  }

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as any,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    256 // 32 bytes
  );

  const derivedBytes = new Uint8Array(derivedBits);
  const hashHex = bytesToHex(derivedBytes);
  const saltHex = bytesToHex(saltBytes);

  return {
    hashBase64: bytesToBase64(derivedBytes),
    saltBase64: bytesToBase64(saltBytes),
    hashHex,
    saltHex,
    iterations,
  };
}

/**
 * Verifies entered password against stored salt, iterations, and hash with constant-time equality.
 * Supports legacy hex formats for backwards compatibility.
 */
export async function verifyPassword(
  passwordAttempt: string,
  storedSalt: string,
  storedHash: string,
  storedIterations = 100000
): Promise<{ isValid: boolean; needsMigration: boolean }> {
  if (!isWebCryptoAvailable()) {
    throw new Error('Web Crypto API is not available.');
  }

  try {
    // Handle plain text migration if detected
    if (!storedSalt && storedHash === passwordAttempt) {
      return { isValid: true, needsMigration: true };
    }

    // Check if stored is legacy hex format
    const isHexSalt = /^[0-9a-fA-F]{32,}$/.test(storedSalt);
    const isHexHash = /^[0-9a-fA-F]{64}$/.test(storedHash);

    const { hashBase64 } = await hashPassword(
      passwordAttempt,
      storedSalt,
      storedIterations || 100000
    );

    if (isHexHash) {
      // Re-encode derived hash to hex for comparison
      const derivedBytes = base64ToBytes(hashBase64);
      const derivedHex = bytesToHex(derivedBytes);
      const isValid = constantTimeEquals(derivedHex.toLowerCase(), storedHash.toLowerCase());
      return { isValid, needsMigration: isValid };
    }

    const isValid = constantTimeEquals(hashBase64, storedHash);
    return { isValid, needsMigration: false };
  } catch {
    return { isValid: false, needsMigration: false };
  }
}
