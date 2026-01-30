import crypto from 'crypto'

// Simple password hashing using PBKDF2 (no external dependency needed)
// For production, consider using bcrypt: npm install bcrypt
const ITERATIONS = 100000
const KEY_LENGTH = 64
const ALGORITHM = 'sha256'

export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(32).toString('hex')
    const hash = crypto
        .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, ALGORITHM)
        .toString('hex')
    return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
    try {
        const [salt, hash] = storedHash.split(':')
        if (!salt || !hash) {
            return false
        }

        const computedHash = crypto
            .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, ALGORITHM)
            .toString('hex')

        // Use constant-time comparison to prevent timing attacks
        return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash))
    } catch {
        // Return false if hash verification fails (malformed hash, encoding errors, etc.)
        return false
    }
}
