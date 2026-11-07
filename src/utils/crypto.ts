import CryptoJS from 'crypto-js';

// 32-byte secret key and 16-byte initialization vector for AES-256-CBC
const AES_SECRET_KEY = import.meta.env.VITE_AES_SECRET_KEY || 'CrescentWealthSecureKey20261107_';
const AES_IV = import.meta.env.VITE_AES_IV || 'CrescentIv16Byte';

/**
 * Encrypts plain text password with AES-256-CBC and returns a Base64 encoded string.
 * This guarantees the password payload is protected in transit before hashing on the server.
 */
export function encryptPasswordPayload(plainText: string): string {
  if (!plainText) return '';
  const key = CryptoJS.enc.Utf8.parse(AES_SECRET_KEY);
  const iv = CryptoJS.enc.Utf8.parse(AES_IV);

  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return encrypted.toString(); // Base64
}
