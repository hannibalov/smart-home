import { describe, it, expect, vi } from 'vitest'
import proxy from './proxy'

// Mock NextResponse for simple markers
vi.mock('next/server', () => ({
    NextResponse: {
        next: (opts: any) => ({ marker: 'next', opts }),
        redirect: (url: URL) => ({ marker: 'redirect', url: url.toString() }),
    },
}))

// Mock Supabase server client to always return no session (simulate unauthenticated)
vi.mock('@supabase/ssr', () => ({
    createServerClient: () => ({
        auth: {
            getSession: async () => ({ data: { session: null } }),
        },
    }),
}))

describe('proxy path normalization and public routes (integration-style)', () => {
    const makeReq = (path: string) => ({
        nextUrl: { pathname: path },
        url: `http://localhost${path}`,
        cookies: { getAll: () => [] },
    } as any)

    it('allows /register and variants without authentication', async () => {
        for (const p of ['/register', '/register/', '/en/register', '/register/something']) {
            const res = await proxy(makeReq(p))
            expect((res as any).marker).toBe('next')
        }
    })

    it('allows /auth/callback without authentication', async () => {
        const res = await proxy(makeReq('/auth/callback'))
        expect((res as any).marker).toBe('next')
    })

    it('redirects protected routes when unauthenticated', async () => {
        const res = await proxy(makeReq('/dashboard'))
        expect((res as any).marker).toBe('redirect')
        expect((res as any).url).toContain('/login')
    })
})
