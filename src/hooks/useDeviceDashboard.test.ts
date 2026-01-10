import { renderHook, waitFor, act } from '@testing-library/react';
import { expect, test, vi, beforeEach, Mock } from 'vitest';
import { useDeviceDashboard } from './useDeviceDashboard';

beforeEach(() => {
    vi.clearAllMocks();
});

test('useDeviceDashboard fetches devices and profiles on mount', async () => {
    const mockDevices = { devices: [{ id: '1', name: 'Test Device' }], scanning: false };
    const mockProfiles = [{ id: 'p1', name: 'Test Profile' }];

    (global.fetch as unknown as Mock).mockImplementation((url: string) => {
        if (url === '/api/devices') {
            return Promise.resolve({
                json: () => Promise.resolve(mockDevices),
            });
        }
        if (url === '/api/profiles') {
            return Promise.resolve({
                json: () => Promise.resolve(mockProfiles),
            });
        }
        return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useDeviceDashboard());

    await waitFor(() => {
        expect(result.current.devices).toEqual(mockDevices.devices);
        expect(result.current.profiles).toEqual(mockProfiles);
    });
});

test('startScan sets scanning to true and calls api', async () => {
    (global.fetch as unknown as Mock).mockImplementation(() => {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ scanning: true }),
        });
    });

    const { result } = renderHook(() => useDeviceDashboard());

    // Wait for initial fetch to finish
    await waitFor(() => expect(result.current.scanning).toBe(false));

    await act(async () => {
        await result.current.startScan();
    });

    expect(result.current.scanning).toBe(true);
});
