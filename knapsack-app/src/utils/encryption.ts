import CryptoJS from 'crypto-js';

// Secret key for encryption (in production, use environment variables)
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'knapsack_secure_2026';

export const Encryption = {
  /**
   * Encrypt sensitive data
   */
  encrypt: (data: unknown): string => {
    try {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Veri şifrelemesi başarısız');
    }
  },

  /**
   * Decrypt sensitive data
   */
  decrypt: (encrypted: string): unknown => {
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(CryptoJS.enc.Utf8);
      if (!decrypted) {
        throw new Error('Decryption returned empty string');
      }
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Veri deşifrelemesi başarısız');
    }
  },

  /**
   * Hash a PIN (one-way encryption for verification)
   */
  hashPin: (pin: string): string => {
    return CryptoJS.SHA256(pin).toString();
  },

  /**
   * Verify a PIN against its hash
   */
  verifyPin: (pin: string, hash: string): boolean => {
    return Encryption.hashPin(pin) === hash;
  },
};
