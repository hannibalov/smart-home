import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setDeviceSettings, getDeviceSettings, resetSettingsForTesting, loadSettings } from './settings';
import { loadDevicesFromDb, saveDeviceToDb } from '../db';

// Mock the DB service
vi.mock('../db', () => ({
    loadDevicesFromDb: vi.fn(),
    saveDeviceToDb: vi.fn(),
}));

describe('BLE Settings (DB persistence)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetSettingsForTesting();
    });

    it('should retrieve settings from DB on load', async () => {
        const mockDbDevices = {
            'device-1': { saved: true, customName: 'Living Room' },
            'device-2': { profileId: 'foo' }
        };
        (loadDevicesFromDb as any).mockResolvedValue(mockDbDevices);

        await loadSettings();

        expect(getDeviceSettings('device-1')).toEqual(mockDbDevices['device-1']);
        expect(getDeviceSettings('device-2')).toEqual(mockDbDevices['device-2']);
    });

    it('should save settings to DB when updated', async () => {
        // Pre-load empty to avoid auto-load triggering
        (loadDevicesFromDb as any).mockResolvedValue({});
        await loadSettings();

        const deviceId = 'test-device';
        const settings = { saved: true, customName: 'My Light' };

        setDeviceSettings(deviceId, settings);

        expect(saveDeviceToDb).toHaveBeenCalledWith(deviceId, expect.objectContaining(settings));
        expect(getDeviceSettings(deviceId)).toEqual(expect.objectContaining(settings));
    });

    it('should NOT save to DB if settings logic detects no change', async () => {
        (loadDevicesFromDb as any).mockResolvedValue({});
        await loadSettings();

        const deviceId = 'test-device-no-change';
        const initial = { saved: true };

        // First set (should save)
        setDeviceSettings(deviceId, initial);
        expect(saveDeviceToDb).toHaveBeenCalledTimes(1);

        // Set same values again (should skip)
        setDeviceSettings(deviceId, { saved: true });
        expect(saveDeviceToDb).toHaveBeenCalledTimes(1);
    });

    it('should handle load failure gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        (loadDevicesFromDb as any).mockRejectedValue(new Error('DB connection failed'));

        await loadSettings();

        expect(consoleSpy).toHaveBeenCalledWith('[SETTINGS] Failed to load:', expect.any(Error));
        // Should still be operational with empty settings
        expect(getDeviceSettings('any-id')).toEqual({});
    });
});
