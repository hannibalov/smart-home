import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase admin client
const mockCreateUser = vi.fn()
const mockFromUpdate = vi.fn()

vi.mock('@/lib/supabase-server', () => ({
    createAdminSupabaseClient: vi.fn(() => ({
        auth: {
            admin: {
                createUser: mockCreateUser,
            },
        },
        from: vi.fn(() => ({
            update: mockFromUpdate,
        })),
    })),
}))

describe('Auth API - Register', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return 400 if email is missing', async () => {
        const { POST } = await import('@/app/api/auth/register/route')

        const request = new Request('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ password: 'testPassword123' }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Email and password are required')
    })

    it('should return 400 if password is missing', async () => {
        const { POST } = await import('@/app/api/auth/register/route')

        const request = new Request('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com' }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Email and password are required')
    })

    it('should return 400 if password is too short', async () => {
        const { POST } = await import('@/app/api/auth/register/route')

        const request = new Request('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'short' }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Password must be at least 8 characters')
    })

    it('should return error if user already exists in Supabase Auth', async () => {
        mockCreateUser.mockResolvedValue({
            data: null,
            error: { message: 'User already registered' },
        })

        const { POST } = await import('@/app/api/auth/register/route')

        const request = new Request('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: 'existing@example.com', password: 'testPassword123' }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('User already registered')
    })

    it('should create a new user successfully', async () => {
        mockCreateUser.mockResolvedValue({
            data: { user: { id: '123', email: 'new@example.com' } },
            error: null,
        })

        mockFromUpdate.mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
        })

        const { POST } = await import('@/app/api/auth/register/route')

        const request = new Request('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: 'new@example.com', password: 'testPassword123', name: 'Test User' }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.user).toBeDefined()
        expect(data.user.email).toBe('new@example.com')
        expect(data.message).toBe('User created successfully')
    })

    it('should use email prefix as name if name not provided', async () => {
        mockCreateUser.mockResolvedValue({
            data: { user: { id: '123', email: 'user@example.com' } },
            error: null,
        })

        mockFromUpdate.mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
        })

        const { POST } = await import('@/app/api/auth/register/route')

        const request = new Request('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: 'user@example.com', password: 'testPassword123' }),
        })

        const response = await POST(request as any)

        expect(response.status).toBe(201)
    })
})

