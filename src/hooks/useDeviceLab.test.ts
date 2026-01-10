import { renderHook, waitFor, act } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import { useDeviceLab } from './useDeviceLab';

beforeEach(() => {
    vi.clearAllMocks();
});

test('useDeviceLab fetches device details and history on mount', async () => {
    const deviceId = 'test-id';
    const mockDevice = { id: deviceId, name: 'Lab Device' };
    const mockLog = { log: [{ id: 1, command: '7e04', success: true, timestamp: Date.now() }] };

    (global.fetch as unknown as vi.Mock).mockImplementation((url: string) => {
        if (url === `/api/devices/${deviceId}`) {
            return Promise.resolve({
                json: () => Promise.resolve(mockDevice),
            });
        }
        if (url === `/api/devices/${deviceId}/control`) {
            return Promise.resolve({
                json: () => Promise.resolve(mockLog),
            });
        }
        // subscriptions
        if (url.includes('/subscribe')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({}),
            });
        }
        return Promise.reject(new Error('Unknown URL: ' + url));
    });

    const { result } = renderHook(() => useDeviceLab(deviceId));

    await waitFor(() => {
        expect(result.current.device).toEqual(mockDevice);
        expect(result.current.logs.length).toBeGreaterThan(0);
        expect(result.current.loading).toBe(false);
    });
});

test('sendCommand updates logs', async () => {
    const deviceId = 'test-id';
    (global.fetch as unknown as vi.Mock).mockImplementation((url: string) => {
        if (url.includes('/control')) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ log: [] }) });
        }
        if (url.includes('/read')) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ value: 'AA' }) });
        }
        return Promise.resolve({ json: () => Promise.resolve({}) });
    });

    const { result } = renderHook(() => useDeviceLab(deviceId));

    await act(async () => {
        await result.current.sendCommand('7e04');
    });

    expect(result.current.logs[0].hex).toBe('7e04');
    expect(result.current.logs[0].readValue).toBe('AA');
});
