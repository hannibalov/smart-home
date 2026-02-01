import { describe, it, expect, vi, beforeEach } from 'vitest'
import proxy from './proxy'

// State to track which request is currently being processed
let currentRequest: any = null

// Mock NextResponse for simple markers
vi.mock('next/server', () => ({
    NextResponse: {
        next: (opts: any) => ({ marker: 'next', opts }),
        redirect: (url: URL) => ({ marker: 'redirect', url: url.toString() }),
    },
}))

// Mock Supabase server client - return session if cookies exist
vi.mock('@supabase/ssr', () => ({
    createServerClient: () => ({
        auth: {
            getSession: async () => {
                // Check if current request has auth cookie
                const hasCookie = currentRequest?.cookies?.getAll?.().some((c: any) => c.name === 'sb-auth')
                return {
                    data: {
                        session: hasCookie ? { user: { email: 'test@example.com' } } : null,
                    },
                }
            },
        },
    }),
}))

describe('proxy path normalization and public routes (integration-style)', () => {
    const makeReq = (path: string, hasCookie = false) => ({
        nextUrl: { pathname: path },
        url: `http://localhost${path}`,
        cookies: {
            getAll: () => (hasCookie ? [{ name: 'sb-auth', value: 'token' }] : []),
        },
    } as any)

    beforeEach(() => {
        currentRequest = null
    })

    it('allows /register and variants without authentication', async () => {
        for (const p of ['/register', '/register/', '/en/register', '/register/something']) {
            const req = makeReq(p)
            currentRequest = req
            const res = await proxy(req)
            expect((res as any).marker).toBe('next')
        }
    })

    it('allows /auth/callback without authentication', async () => {
        const req = makeReq('/auth/callback')
        currentRequest = req
        const res = await proxy(req)
        expect((res as any).marker).toBe('next')
    })

    it('redirects protected routes when unauthenticated', async () => {
        const req = makeReq('/dashboard')
        currentRequest = req
        const res = await proxy(req)
        expect((res as any).marker).toBe('redirect')
        expect((res as any).url).toContain('/login')
    })

    it('CRITICAL: allows protected routes when authenticated', async () => {
        const req = makeReq('/dashboard', true)
        currentRequest = req
        const res = await proxy(req)
        expect((res as any).marker).toBe('next')
    })

    it('CRITICAL: allows home route when authenticated', async () => {
        const req = makeReq('/', true)
        currentRequest = req
        const res = await proxy(req)
        expect((res as any).marker).toBe('next')
    })
})