import { describe, it, expect, vi } from 'vitest'
import proxy from './proxy'

// Mock NextResponse to make assertions simple
vi.mock('next/server', () => ({
  NextResponse: {
    next: (opts: any) => ({ marker: 'next', opts }),
    redirect: (url: URL) => ({ marker: 'redirect', url: url.toString() }),
  },
}))

// Mock Supabase server client to inspect the cookies.getAll function passed in
vi.mock('@supabase/ssr', () => ({
  createServerClient: (url: string, key: string, opts: any) => {
    const getAllFn = opts?.cookies?.getAll ?? (() => [])

    return {
      auth: {
        getSession: async () => {
          const cookies = getAllFn()
          const hasAuth = Array.isArray(cookies) && cookies.some((c: any) => c?.name === 'supabase-auth-token')
          return { data: { session: hasAuth ? { user: { id: 'u1' } } : null } }
        },
      },
    }
  },
}))

describe('proxy cookie mapping (unit)', () => {
  it('returns next when auth cookie is present', async () => {
    const req = {
      nextUrl: { pathname: '/dashboard' },
      url: 'http://localhost/dashboard',
      // Simulate NextRequest.cookies.getAll() returning RequestCookie-like objects
      cookies: { getAll: () => [{ name: 'supabase-auth-token', value: 'abc' }] },
    } as any

    const res = await proxy(req)
    expect((res as any).marker).toBe('next')
  })

  it('redirects to /login when no auth cookie present', async () => {
    const req = {
      nextUrl: { pathname: '/dashboard' },
      url: 'http://localhost/dashboard',
      cookies: { getAll: () => [] },
    } as any

    const res = await proxy(req)
    expect((res as any).marker).toBe('redirect')
    expect((res as any).url).toContain('/login')
  })
})
