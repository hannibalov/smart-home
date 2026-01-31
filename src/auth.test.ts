import { expect, test, describe } from 'vitest'
import { supabaseClient } from '@/lib/supabase-client'

/**
 * Tests for Supabase Authentication
 * Note: These are mostly integration tests that verify the auth client is properly configured.
 * Full E2E testing should be done with actual Supabase auth flows.
 */
describe('Supabase Auth Configuration', () => {
    describe('Client Setup', () => {
        test('should have supabaseClient defined', () => {
            expect(supabaseClient).toBeDefined()
        })

        test('should have auth methods available', () => {
            expect(supabaseClient.auth).toBeDefined()
            expect(typeof supabaseClient.auth.signInWithPassword).toBe('function')
            expect(typeof supabaseClient.auth.signInWithOAuth).toBe('function')
            expect(typeof supabaseClient.auth.signOut).toBe('function')
            expect(typeof supabaseClient.auth.signUp).toBe('function')
        })
    })

    describe('Environment Variables', () => {
        test('should have NEXT_PUBLIC_SUPABASE_URL set', () => {
            expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
            expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toContain('supabase.co')
        })

        test('should have NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY set', () => {
            expect(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBeDefined()
            expect(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toContain('sb_publishable')
        })

        test('should have SUPABASE_SECRET_KEY set for server operations', () => {
            expect(process.env.SUPABASE_SECRET_KEY).toBeDefined()
        })
    })

    describe('Auth Methods', () => {
        test('signInWithPassword should be callable with email and password', async () => {
            // This is a structural test - actual auth requires valid Supabase setup
            const mockEmail = 'test@example.com'
            const mockPassword = 'password123'

            expect(() => {
                supabaseClient.auth.signInWithPassword({
                    email: mockEmail,
                    password: mockPassword,
                })
            }).not.toThrow()
        })

        test('signInWithOAuth should support google provider', async () => {
            expect(() => {
                supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: 'http://localhost:3000/auth/callback',
                    },
                })
            }).not.toThrow()
        })

        test('signOut should be callable', async () => {
            expect(typeof supabaseClient.auth.signOut).toBe('function')
        })
    })
})

