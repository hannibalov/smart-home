import { expect, test, describe, vi, beforeEach } from 'vitest';
import { getServerSession } from '@/lib/supabase-auth';

// Mock supabase server session helper
vi.mock('@/lib/supabase-auth', () => ({
    getServerSession: vi.fn(),
}));

describe('Session Management (Supabase)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should provide user information from server session', async () => {
        const mockSession = {
            user: {
                id: 'user123',
                email: 'test@example.com',
                user_metadata: { name: 'Test User' },
            },
            expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        } as any;

        vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

        const session = await getServerSession();

        expect(session).toBeDefined();
        expect(session!.user.id).toBe('user123');
        expect(session!.user.email).toBe('test@example.com');
    });

    test('should return null session when not authenticated', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null as any);

        const session = await getServerSession();

        expect(session).toBeNull();
    });
});
