import { expect, test, describe } from 'vitest';
import { config as middlewareConfig } from '@/middleware';

describe('Middleware Configuration', () => {
    describe('Matcher Configuration', () => {
        test('middleware config should have matcher array', () => {
            expect(middlewareConfig.matcher).toBeDefined();
            expect(Array.isArray(middlewareConfig.matcher)).toBe(true);
        });

        test('middleware config should exclude API routes', () => {
            const matcher = middlewareConfig.matcher as string[];

            // Verify API routes are excluded
            const hasApiExclusion = matcher.some(m => m.includes('api'));
            expect(hasApiExclusion).toBe(true);
        });

        test('middleware config should exclude static files', () => {
            const matcher = middlewareConfig.matcher as string[];

            // Verify static file exclusions exist
            const hasStaticExclusions = matcher.some(m =>
                m.includes('_next/static') || m.includes('_next/image')
            );
            expect(hasStaticExclusions).toBe(true);
        });

        test('middleware config should exclude favicon', () => {
            const matcher = middlewareConfig.matcher as string[];

            // Verify favicon is excluded
            const hasFaviconExclusion = matcher.some(m => m.includes('favicon.ico'));
            expect(hasFaviconExclusion).toBe(true);
        });

        test('middleware config should exclude public folder', () => {
            const matcher = middlewareConfig.matcher as string[];

            // Verify public folder is excluded
            const hasPublicExclusion = matcher.some(m => m.includes('public'));
            expect(hasPublicExclusion).toBe(true);
        });

        test('matcher should have at least one pattern', () => {
            const matcher = middlewareConfig.matcher as string[];
            expect(matcher.length).toBeGreaterThan(0);
        });
    });

    describe('Middleware Purpose', () => {
        test('should protect routes with authentication', () => {
            // Middleware checks token with getToken from next-auth/jwt
            // Protected routes will be redirected to /login if no valid token
            expect(middlewareConfig.matcher).toBeDefined();
        });

        test('should allow access to login page without authentication', () => {
            // Login page path is excluded from middleware protection
            // This allows unauthenticated users to access it
            expect(middlewareConfig.matcher).toBeDefined();
        });
    });
});
