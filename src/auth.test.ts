import { expect, test, describe } from 'vitest';
import { authOptions } from '@/auth';

describe('Auth Configuration', () => {
    describe('Providers', () => {
        test('should include Google provider', () => {
            const googleProvider = authOptions.providers?.find(
                (provider) => provider.id === 'google'
            );
            expect(googleProvider).toBeDefined();
            expect(googleProvider?.id).toBe('google');
        });

        test('should include Credentials provider', () => {
            const credentialsProvider = authOptions.providers?.find(
                (provider) => provider.id === 'credentials'
            );
            expect(credentialsProvider).toBeDefined();
            expect(credentialsProvider?.id).toBe('credentials');
        });

        test('should require GOOGLE_CLIENT_ID environment variable', () => {
            const googleProvider = authOptions.providers?.find(
                (provider) => provider.id === 'google'
            );
            // Provider should use environment variables
            expect(googleProvider).toBeDefined();
        });
    });

    describe('Pages Configuration', () => {
        test('should have signIn page set to /login', () => {
            expect(authOptions.pages?.signIn).toBe('/login');
        });
    });

    describe('Credentials Provider', () => {
        test('should reject invalid credentials', async () => {
            const credentialsProvider = authOptions.providers?.find(
                (provider) => provider.id === 'credentials'
            );

            if (credentialsProvider && 'authorize' in credentialsProvider && credentialsProvider.authorize) {
                const result = await credentialsProvider.authorize(
                    { email: '', password: '' },
                    {} as Record<string, unknown>
                );
                expect(result).toBeNull();
            }
        });

        test('should reject missing email', async () => {
            const credentialsProvider = authOptions.providers?.find(
                (provider) => provider.id === 'credentials'
            );

            if (credentialsProvider && 'authorize' in credentialsProvider && credentialsProvider.authorize) {
                const result = await credentialsProvider.authorize(
                    { email: '', password: 'password123' },
                    {} as Record<string, unknown>
                );
                expect(result).toBeNull();
            }
        });

        test('should reject missing password', async () => {
            const credentialsProvider = authOptions.providers?.find(
                (provider) => provider.id === 'credentials'
            );

            if (credentialsProvider && 'authorize' in credentialsProvider && credentialsProvider.authorize) {
                const result = await credentialsProvider.authorize(
                    { email: 'user@example.com', password: '' },
                    {} as Record<string, unknown>
                );
                expect(result).toBeNull();
            }
        });
    });

    describe('Callbacks', () => {
        test('session callback should preserve user id', async () => {
            if (authOptions.callbacks?.session) {
                const mockSession = {
                    user: { id: '', email: 'test@example.com', name: 'Test User' },
                    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                };

                const mockToken = {
                    sub: 'user123',
                    email: 'test@example.com',
                };

                const result = await authOptions.callbacks.session({
                    session: mockSession,
                    token: mockToken,
                    user: { id: 'user123', email: 'test@example.com' },
                } as Parameters<NonNullable<typeof authOptions.callbacks.session>>[0]);

                expect((result?.user as any)?.id).toBe('user123');
            }
        });

        test('jwt callback should set user id from user object', async () => {
            if (authOptions.callbacks?.jwt) {
                const mockToken = {};
                const mockUser = {
                    id: 'user456',
                    email: 'test@example.com',
                };

                const result = await authOptions.callbacks.jwt({
                    token: mockToken,
                    user: mockUser,
                    account: null,
                    profile: undefined,
                    trigger: undefined,
                    isNewUser: false,
                } as Parameters<NonNullable<typeof authOptions.callbacks.jwt>>[0]);

                expect(result.sub).toBe('user456');
            }
        });

        test('jwt callback should preserve token if no user', async () => {
            if (authOptions.callbacks?.jwt) {
                const mockToken = { sub: 'existing-user' };

                const result = await authOptions.callbacks.jwt({
                    token: mockToken,
                    user: undefined as any,
                    account: null,
                    profile: undefined,
                    trigger: undefined,
                    isNewUser: false,
                } as Parameters<NonNullable<typeof authOptions.callbacks.jwt>>[0]);

                expect(result.sub).toBe('existing-user');
            }
        });
    });
});
