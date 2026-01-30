import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    initialize,
    resetStateForTesting,
    updateDeviceLastState,
    getDeviceSettings,
    handleDiscover,
    getStateForTesting
} from '../ble';
import { updateDeviceState } from '../hub';
import { loadDevicesFromDb, saveDeviceToDb } from '../db';
import { resetSettingsForTesting } from './settings';

// Mock DB service
vi.mock('../db', () => ({
    loadDevicesFromDb: vi.fn(),
    saveDeviceToDb: vi.fn(),
}));

describe('BLE State Persistence', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        resetSettingsForTesting();
        resetStateForTesting();

        // Default empty DB
        (loadDevicesFromDb as any).mockResolvedValue({});

        await initialize();
    });

    it('should save last state when updateDeviceLastState is called', () => {
        const deviceId = 'test-device';
        const state = { power: true, brightness: 75 };

        updateDeviceLastState(deviceId, state);

        const settings = getDeviceSettings(deviceId);
        expect(settings.lastState).toEqual(expect.objectContaining(state));
        expect(saveDeviceToDb).toHaveBeenCalled();
    });

    it('should restore last state when device is discovered', async () => {
        const deviceId = 'test-device';
        const savedState = { power: true, brightness: 75, colorTemperature: 50 };

        // Mock existing settings in DB
        (loadDevicesFromDb as any).mockResolvedValue({
            [deviceId]: { lastState: savedState, saved: true }
        });

        // Re-initialize to load mocked settings
        resetSettingsForTesting();
        resetStateForTesting();
        await initialize();

        // Simulate discovery
        const mockPeripheral = {
            id: deviceId,
            advertisement: { localName: 'Test Lamp' },
            rssi: -60,
            state: 'disconnected'
        };

        handleDiscover(mockPeripheral as any);

        const state = getStateForTesting();
        const device = state.devices.get(deviceId);

        expect(device).toBeDefined();
        expect(device?.state).toEqual(savedState);
    });

    it('should update state when updateDeviceState is called', async () => {
        const deviceId = 'test-device';

        // Setup device in state
        const state = getStateForTesting();
        state.devices.set(deviceId, {
            id: deviceId,
            name: 'Test Lamp',
            connected: true,
            saved: true,
            characteristics: [],
            services: [],
            rssi: -60,
            lastSeen: Date.now()
        } as any);

        state.isMockMode = true;

        // In new architecture, we update state through the hub
        await updateDeviceState(deviceId, { brightness: 42 }, 'ui');

        const settings = getDeviceSettings(deviceId);
        expect(settings.lastState?.brightness).toBe(42);
        expect(saveDeviceToDb).toHaveBeenCalled();
    });

    it('should NOT save if the state hasn\'t changed', async () => {
        const deviceId = 'unique-test-device';
        const state = { power: true, brightness: 88 };

        // First save
        updateDeviceLastState(deviceId, state);
        expect(saveDeviceToDb).toHaveBeenCalledTimes(1);

        // Second save with same data
        updateDeviceLastState(deviceId, state);
        expect(saveDeviceToDb).toHaveBeenCalledTimes(1);
    });
});
