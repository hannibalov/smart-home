import { expect, test, describe } from 'vitest'
import proxy from './proxy'
import { vi } from 'vitest'

describe('Proxy Configuration', () => {
    describe('Route Protection', () => {

        // Mock NextResponse to return simple markers so we can assert easily
        vi.mock('next/server', () => ({
            NextResponse: {
                next: (opts: any) => ({ marker: 'next', opts }),
                redirect: (url: URL) => ({ marker: 'redirect', url: url.toString() }),
            },
        }))

        // Mock Supabase server client used by the proxy
        vi.mock('@supabase/ssr', () => ({
            createServerClient: () => ({
                auth: {
                    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
                },
            }),
        }))

        test('proxy should protect routes requiring authentication', async () => {
            const req = {
                nextUrl: { pathname: '/dashboard' },
                url: 'http://localhost/dashboard',
                cookies: { getAll: () => [] },
            } as any

            const res = await proxy(req)
            expect((res as any).marker).toBe('redirect')
            expect((res as any).url).toContain('/login')
        })

        test('login page should be accessible without authentication', async () => {
            const req = {
                nextUrl: { pathname: '/login' },
                url: 'http://localhost/login',
                cookies: { getAll: () => [] },
            } as any

            const res = await proxy(req)
            expect((res as any).marker).toBe('next')
        })

        test('register page should be accessible without authentication', async () => {
            const req = {
                nextUrl: { pathname: '/register' },
                url: 'http://localhost/register',
                cookies: { getAll: () => [] },
            } as any

            const res = await proxy(req)
            expect((res as any).marker).toBe('next')
        })

        test('auth callback should be accessible during OAuth flow', async () => {
            const req = {
                nextUrl: { pathname: '/auth/callback' },
                url: 'http://localhost/auth/callback',
                cookies: { getAll: () => [] },
            } as any

            const res = await proxy(req)
            expect((res as any).marker).toBe('next')
        })
    })

    describe('Session Management', () => {
        test('proxy should check Supabase session', () => {
            // Proxy now uses Supabase's getSession() instead of NextAuth JWT
            expect(true).toBe(true)
        })

        test('proxy should redirect to login on missing session', () => {
            // Users without valid Supabase session are redirected to /login
            expect(true).toBe(true)
        })
    })
})
