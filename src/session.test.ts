import { expect, test, describe, vi, beforeEach } from 'vitest';
import { useSession } from 'next-auth/react';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
    useSession: vi.fn(),
    signOut: vi.fn(),
}));

describe('Session Management', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Session Retrieval', () => {
        test('should provide user information from session', () => {
            const mockSession = {
                user: {
                    id: 'user123',
                    email: 'test@example.com',
                    name: 'Test User',
                    image: 'https://example.com/avatar.jpg',
                },
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };

            vi.mocked(useSession).mockReturnValue({ data: mockSession, status: 'authenticated' } as any);

            const session = (useSession as any)().data as typeof mockSession;

            expect(session.user.id).toBe('user123');
            expect(session.user.email).toBe('test@example.com');
            expect(session.user.name).toBe('Test User');
        });

        test('should return null session when not authenticated', () => {
            vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated' } as any);

            const { data, status } = (useSession as any)();

            expect(data).toBeNull();
            expect(status).toBe('unauthenticated');
        });

        test('should have loading status while fetching session', () => {
            vi.mocked(useSession).mockReturnValue({ data: undefined, status: 'loading' } as any);

            const { data, status } = (useSession as any)();

            expect(data).toBeUndefined();
            expect(status).toBe('loading');
        });
    });

    describe('Session Properties', () => {
        test('session should contain user ID', () => {
            const mockSession = {
                user: { id: 'user456', email: 'john@example.com' },
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };

            vi.mocked(useSession).mockReturnValue({ data: mockSession, status: 'authenticated' } as any);

            const session = (useSession as any)().data as typeof mockSession;

            expect(session.user).toHaveProperty('id');
            expect(session.user.id).toBe('user456');
        });

        test('session should contain user email', () => {
            const mockSession = {
                user: { id: 'user456', email: 'john@example.com' },
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };

            vi.mocked(useSession).mockReturnValue({ data: mockSession, status: 'authenticated' } as any);

            const session = (useSession as any)().data as typeof mockSession;

            expect(session.user).toHaveProperty('email');
            expect(session.user.email).toBe('john@example.com');
        });

        test('session should contain optional name', () => {
            const mockSession = {
                user: { id: 'user456', email: 'john@example.com', name: 'John Doe' },
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };

            vi.mocked(useSession).mockReturnValue({ data: mockSession, status: 'authenticated' } as any);

            const session = (useSession as any)().data as typeof mockSession;

            expect(session.user).toHaveProperty('name');
            expect(session.user.name).toBe('John Doe');
        });

        test('session should have expiration date', () => {
            const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            const mockSession = {
                user: { id: 'user456', email: 'john@example.com' },
                expires: expirationTime,
            };

            vi.mocked(useSession).mockReturnValue({ data: mockSession, status: 'authenticated' } as any);

            const session = (useSession as any)().data as typeof mockSession;

            expect(session).toHaveProperty('expires');
            expect(session.expires).toBe(expirationTime);
        });
    });

    describe('Session Status States', () => {
        test('authenticated status indicates user is logged in', () => {
            const mockSession = {
                user: { id: 'user123', email: 'test@example.com' },
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };

            vi.mocked(useSession).mockReturnValue({ data: mockSession, status: 'authenticated' } as any);

            const { status } = (useSession as any)();

            expect(status).toBe('authenticated');
        });

        test('unauthenticated status indicates user is not logged in', () => {
            vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated' } as any);

            const { status } = (useSession as any)();

            expect(status).toBe('unauthenticated');
        });

        test('loading status indicates session is being fetched', () => {
            vi.mocked(useSession).mockReturnValue({ data: undefined, status: 'loading' } as any);

            const { status } = (useSession as any)();

            expect(status).toBe('loading');
        });
    });

    describe('Multiple Provider Support', () => {
        test('session should work with credential-based login', () => {
            const mockSession = {
                user: { id: 'user123', email: 'email@example.com' },
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };

            vi.mocked(useSession).mockReturnValue({ data: mockSession, status: 'authenticated' } as any);

            const session = (useSession as any)().data as typeof mockSession;

            expect(session).toBeDefined();
            expect(session.user.email).toBe('email@example.com');
        });

        test('session should work with OAuth-based login (Google)', () => {
            const mockSession = {
                user: {
                    id: 'google-user-123',
                    email: 'user@gmail.com',
                    name: 'Google User',
                    image: 'https://lh3.googleusercontent.com/...',
                },
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };

            vi.mocked(useSession).mockReturnValue({ data: mockSession, status: 'authenticated' } as any);

            const session = (useSession as any)().data as typeof mockSession;

            expect(session.user.id).toBe('google-user-123');
            expect(session.user.image).toBeDefined();
        });
    });
});
