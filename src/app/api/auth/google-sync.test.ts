import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockSupabaseSelect = vi.fn()
const mockSupabaseInsert = vi.fn()
const mockSupabaseFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: mockSupabaseFrom,
    },
}))

describe('Auth API - Google Sync', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return 400 if google_id is missing', async () => {
        const { POST } = await import('@/app/api/auth/google-sync/route')

        const request = new Request('http://localhost:3000/api/auth/google-sync', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com' }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Google ID and email are required')
    })

    it('should return 400 if email is missing', async () => {
        const { POST } = await import('@/app/api/auth/google-sync/route')

        const request = new Request('http://localhost:3000/api/auth/google-sync', {
            method: 'POST',
            body: JSON.stringify({ google_id: '123456' }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Google ID and email are required')
    })

    it('should create new user with Google OAuth', async () => {
        const mockOrSelect = vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })

        const mockSelect = vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
                data: {
                    id: '123',
                    email: 'test@example.com',
                    name: 'Test User',
                    google_id: 'google123',
                    auth_provider: 'google',
                },
                error: null,
            }),
        })

        const mockInsert = vi.fn().mockReturnValue({
            select: mockSelect,
        })

        mockSupabaseFrom.mockImplementation((table: string) => {
            if (table === 'users') {
                return {
                    select: mockSupabaseSelect,
                    insert: mockInsert,
                }
            }
        })

        mockSupabaseSelect.mockReturnValue({
            or: mockOrSelect,
        })

        const { POST } = await import('@/app/api/auth/google-sync/route')

        const request = new Request('http://localhost:3000/api/auth/google-sync', {
            method: 'POST',
            body: JSON.stringify({
                google_id: 'google123',
                email: 'test@example.com',
                name: 'Test User',
            }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.user).toBeDefined()
        expect(data.user.google_id).toBe('google123')
        expect(data.user.auth_provider).toBe('google')
    })

    it('should return existing user if google_id already exists', async () => {
        const mockUser = {
            id: '123',
            email: 'test@example.com',
            google_id: 'google123',
            auth_provider: 'google',
        }

        const mockOrSelect = vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
        })

        mockSupabaseFrom.mockReturnValue({
            select: mockSupabaseSelect,
        })

        mockSupabaseSelect.mockReturnValue({
            or: mockOrSelect,
        })

        const { POST } = await import('@/app/api/auth/google-sync/route')

        const request = new Request('http://localhost:3000/api/auth/google-sync', {
            method: 'POST',
            body: JSON.stringify({
                google_id: 'google123',
                email: 'test@example.com',
            }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.user).toBeDefined()
        expect(data.user.id).toBe('123')
    })

    it('should update existing email user to both auth providers', async () => {
        const mockUserEmailOnly = {
            id: '123',
            email: 'test@example.com',
            google_id: null,
            auth_provider: 'email',
        }

        const mockOrSelect = vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockUserEmailOnly, error: null }),
        })

        const mockUpdate = vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
        })

        mockSupabaseFrom.mockReturnValue({
            select: mockSupabaseSelect,
            update: mockUpdate,
        })

        mockSupabaseSelect.mockReturnValue({
            or: mockOrSelect,
        })

        const { POST } = await import('@/app/api/auth/google-sync/route')

        const request = new Request('http://localhost:3000/api/auth/google-sync', {
            method: 'POST',
            body: JSON.stringify({
                google_id: 'google123',
                email: 'test@example.com',
            }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(mockUpdate).toHaveBeenCalled()
    })
})
