import { describe, it, expect } from 'vitest'

describe('Auth API - Google Sync (DEPRECATED)', () => {
    it('should return 410 Gone status', async () => {
        const { POST } = await import('@/app/api/auth/google-sync/route')

        const response = await POST()

        expect(response.status).toBe(410)
    })

    it('should indicate endpoint is deprecated', async () => {
        const { POST } = await import('@/app/api/auth/google-sync/route')

        const response = await POST()
        const data = await response.json()

        expect(data.error).toContain('deprecated')
    })
})


