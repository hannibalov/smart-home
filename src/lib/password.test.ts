import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/password'

describe('Password Hashing', () => {
    it('should hash a password', () => {
        const password = 'testPassword123!'
        const hash = hashPassword(password)

        expect(hash).toBeDefined()
        expect(hash).toContain(':')
        expect(hash).not.toEqual(password)
    })

    it('should create different hashes for the same password', () => {
        const password = 'testPassword123!'
        const hash1 = hashPassword(password)
        const hash2 = hashPassword(password)

        expect(hash1).not.toEqual(hash2)
    })

    it('should verify a correct password', () => {
        const password = 'testPassword123!'
        const hash = hashPassword(password)

        const isValid = verifyPassword(password, hash)
        expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', () => {
        const password = 'testPassword123!'
        const wrongPassword = 'wrongPassword123!'
        const hash = hashPassword(password)

        const isValid = verifyPassword(wrongPassword, hash)
        expect(isValid).toBe(false)
    })

    it('should reject malformed hash format', () => {
        const password = 'testPassword123!'
        const malformedHash = 'notavalidhash'

        const isValid = verifyPassword(password, malformedHash)
        expect(isValid).toBe(false)
    })

    it('should handle empty strings', () => {
        const hash = hashPassword('')
        expect(hash).toBeDefined()
        expect(verifyPassword('', hash)).toBe(true)
    })

    it('should handle long passwords', () => {
        const longPassword = 'a'.repeat(1000)
        const hash = hashPassword(longPassword)

        expect(verifyPassword(longPassword, hash)).toBe(true)
        expect(verifyPassword('a'.repeat(999), hash)).toBe(false)
    })

    it('should handle special characters', () => {
        const specialPassword = 'P@ssw0rd!#$%^&*()'
        const hash = hashPassword(specialPassword)

        expect(verifyPassword(specialPassword, hash)).toBe(true)
        expect(verifyPassword('P@ssw0rd!#$%^&*(', hash)).toBe(false)
    })
})
