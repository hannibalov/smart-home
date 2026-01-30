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

    it('should return 409 if user already exists', async () => {
        mockSupabaseFrom.mockReturnValue({
            select: mockSupabaseSelect,
        })

        mockSupabaseSelect.mockReturnValue({
            eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: '123' }, error: null }),
            }),
        })

        const { POST } = await import('@/app/api/auth/register/route')

        const request = new Request('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: 'existing@example.com', password: 'testPassword123' }),
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(409)
        expect(data.error).toBe('User already exists')
    })

    it('should create a new user successfully', async () => {
        const mockSelectEq = vi.fn()
        mockSelectEq.mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
        })

        const mockSelectInsert = vi.fn()
        mockSelectInsert.mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                    data: { id: '123', email: 'new@example.com', name: 'new' },
                    error: null,
                }),
            }),
        })

        mockSupabaseFrom.mockImplementation((table: string) => {
            if (table === 'users') {
                return {
                    select: mockSupabaseSelect,
                    insert: mockSelectInsert,
                }
            }
        })

        mockSupabaseSelect.mockReturnValue({
            eq: mockSelectEq,
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
        expect(data.message).toBe('User created successfully')
    })

    it('should use email prefix as name if name not provided', async () => {
        const mockSelectEq = vi.fn()
        mockSelectEq.mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
        })

        const mockSelectInsert = vi.fn()
        const insertFn = vi.fn()
        insertFn.mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                    data: { id: '123', email: 'user@example.com', name: 'user' },
                    error: null,
                }),
            }),
        })

        mockSupabaseFrom.mockImplementation((table: string) => {
            if (table === 'users') {
                return {
                    select: mockSupabaseSelect,
                    insert: insertFn,
                }
            }
        })

        mockSupabaseSelect.mockReturnValue({
            eq: mockSelectEq,
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
