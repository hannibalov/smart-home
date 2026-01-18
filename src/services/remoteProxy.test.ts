
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shouldProxy, proxyToRemote } from './remoteProxy';

describe('remoteProxy', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
        vi.stubGlobal('fetch', vi.fn());
    });

    describe('shouldProxy', () => {
        it('should return false when REMOTE_CONTROL_URL is not set', () => {
            delete process.env.REMOTE_CONTROL_URL;
            expect(shouldProxy()).toBe(false);
        });

        it('should return true when REMOTE_CONTROL_URL is set', () => {
            process.env.REMOTE_CONTROL_URL = 'http://pi.local:3000';
            expect(shouldProxy()).toBe(true);
        });
    });

    describe('proxyToRemote', () => {
        it('should forward request to remote URL', async () => {
            process.env.REMOTE_CONTROL_URL = 'http://pi.local:3000';
            const mockFetch = vi.mocked(fetch);
            mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }));

            const request = new Request('http://localhost:3000/api/devices', {
                method: 'GET',
                headers: { 'X-Test': 'true' }
            });

            const response = await proxyToRemote(request);
            const data = await response.json();

            expect(mockFetch).toHaveBeenCalledWith(
                'http://pi.local:3000/api/devices',
                expect.objectContaining({
                    method: 'GET'
                })
            );
            expect(data.success).toBe(true);
            expect(response.status).toBe(200);
        });

        it('should handle fetch errors gracefully', async () => {
            process.env.REMOTE_CONTROL_URL = 'http://pi.local:3000';
            const mockFetch = vi.mocked(fetch);
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const request = new Request('http://localhost:3000/api/devices');
            const response = await proxyToRemote(request);
            const data = await response.json();

            expect(response.status).toBe(502);
            expect(data.error).toBe('Failed to reach remote controller');
        });
    });
});
