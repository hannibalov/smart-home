import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock supabase
const mockSupabaseSelect = vi.fn()
const mockSupabaseInsert = vi.fn()
const mockSupabaseFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: mockSupabaseFrom,
    },
}))

vi.mock('@/lib/password', () => ({
    hashPassword: (password: string) => {
        return `hashed_${password}`
    },
    verifyPassword: (password: string, hash: string) => {
        return `hashed_${password}` === hash
    },
}))

describe('Auth API - Validate Credentials', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return 400 if email is missing', async () => {
        const { POST } = await import('@/app/api/auth/validate-credentials/route')

        const request = new Request('http://localhost:3000/api/auth/validate-credentials', {
            method: 'POST',
            body: JSON.stringify({ password: 'test123' }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Email and password are required')
    })

    it('should return 400 if password is missing', async () => {
        const { POST } = await import('@/app/api/auth/validate-credentials/route')

        const request = new Request('http://localhost:3000/api/auth/validate-credentials', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com' }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Email and password are required')
    })

    it('should return 401 if user not found', async () => {
        mockSupabaseFrom.mockReturnValue({
            select: mockSupabaseSelect,
        })

        mockSupabaseSelect.mockReturnValue({
            eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
            }),
        })

        const { POST } = await import('@/app/api/auth/validate-credentials/route')

        const request = new Request('http://localhost:3000/api/auth/validate-credentials', {
            method: 'POST',
            body: JSON.stringify({ email: 'notfound@example.com', password: 'password123' }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Invalid email or password')
    })

    it('should return 401 if user is inactive', async () => {
        const mockUser = {
            id: '123',
            email: 'test@example.com',
            name: 'Test User',
            password_hash: 'hashed_password123',
            is_active: false,
        }

        mockSupabaseFrom.mockReturnValue({
            select: mockSupabaseSelect,
        })

        mockSupabaseSelect.mockReturnValue({
            eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
            }),
        })

        const { POST } = await import('@/app/api/auth/validate-credentials/route')

        const request = new Request('http://localhost:3000/api/auth/validate-credentials', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Account is inactive')
    })

    it('should return 401 if password is incorrect', async () => {
        const mockUser = {
            id: '123',
            email: 'test@example.com',
            name: 'Test User',
            password_hash: 'hashed_correctpassword',
            is_active: true,
        }

        mockSupabaseFrom.mockReturnValue({
            select: mockSupabaseSelect,
        })

        mockSupabaseSelect.mockReturnValue({
            eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
            }),
        })

        const { POST } = await import('@/app/api/auth/validate-credentials/route')

        const request = new Request('http://localhost:3000/api/auth/validate-credentials', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Invalid email or password')
    })

    it('should return user data if credentials are valid', async () => {
        const mockUser = {
            id: '123',
            email: 'test@example.com',
            name: 'Test User',
            password_hash: 'hashed_password123',
            is_active: true,
        }

        mockSupabaseFrom.mockReturnValue({
            select: mockSupabaseSelect,
        })

        mockSupabaseSelect.mockReturnValue({
            eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
            }),
        })

        const { POST } = await import('@/app/api/auth/validate-credentials/route')

        const request = new Request('http://localhost:3000/api/auth/validate-credentials', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.user).toBeDefined()
        expect(data.user.email).toBe('test@example.com')
        expect(data.user.name).toBe('Test User')
        expect(data.user.password_hash).toBeUndefined()
    })
})
