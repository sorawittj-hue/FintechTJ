/**
 * Secure Storage Utilities
 * 
 * Provides encryption for sensitive data stored in localStorage.
 * Uses Web Crypto API for secure encryption.
 */

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

/**
 * Generate a cryptographic key from a seed
 * Uses sessionStorage to avoid persisting keys alongside encrypted data in localStorage.
 * Session keys are cleared when the browser tab is closed.
 */
async function getOrCreateKey(): Promise<CryptoKey> {
    const storedKey = sessionStorage.getItem('_sk');

    if (storedKey) {
        const keyData = JSON.parse(storedKey);
        return await crypto.subtle.importKey(
            'jwk',
            keyData,
            { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
            true,
            ['encrypt', 'decrypt']
        );
    }

    const key = await crypto.subtle.generateKey(
        { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
        true,
        ['encrypt', 'decrypt']
    );

    const exportedKey = await crypto.subtle.exportKey('jwk', key);
    sessionStorage.setItem('_sk', JSON.stringify(exportedKey));

    return key;
}

/**
 * Encrypt data before storing
 */
export async function encryptData(data: string): Promise<string> {
    try {
        const key = await getOrCreateKey();
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

        const encrypted = await crypto.subtle.encrypt(
            { name: ENCRYPTION_ALGORITHM, iv },
            key,
            new TextEncoder().encode(data)
        );

        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt stored data
 */
export async function decryptData(encryptedString: string): Promise<string> {
    try {
        const key = await getOrCreateKey();
        const combined = new Uint8Array(
            atob(encryptedString).split('').map(c => c.charCodeAt(0))
        );

        const iv = combined.slice(0, IV_LENGTH);
        const encrypted = combined.slice(IV_LENGTH);

        const decrypted = await crypto.subtle.decrypt(
            { name: ENCRYPTION_ALGORITHM, iv },
            key,
            encrypted
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Securely store data with encryption
 */
export async function setSecureItem(key: string, value: unknown): Promise<void> {
    const data = JSON.stringify(value);
    const encrypted = await encryptData(data);
    localStorage.setItem(key, encrypted);
}

/**
 * Securely retrieve and decrypt data
 */
export async function getSecureItem<T>(key: string): Promise<T | null> {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
        const decrypted = await decryptData(encrypted);
        return JSON.parse(decrypted) as T;
    } catch {
        return null;
    }
}

/**
 * Remove secure item
 */
export function removeSecureItem(key: string): void {
    localStorage.removeItem(key);
}

/**
 * Clear all secure storage (use on logout)
 */
export function clearSecureStorage(): void {
    const localKeysToRemove = ['quantai_guest_session', 'portfolio-storage'];
    localKeysToRemove.forEach(key => localStorage.removeItem(key));
    const sessionKeysToRemove = ['_sk'];
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
}

export default {
    encryptData,
    decryptData,
    setSecureItem,
    getSecureItem,
    removeSecureItem,
    clearSecureStorage,
};
