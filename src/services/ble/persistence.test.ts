import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    initialize,
    resetStateForTesting,
    updateDeviceLastState,
    getDeviceSettings,
    handleDiscover,
    sendLightCommand,
    getStateForTesting
} from '../ble';
import { updateDeviceState } from '../hub';
import { EventEmitter } from 'events';

// FS Mock
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(() => true),
        writeFileSync: vi.fn(),
        readFileSync: vi.fn(() => '{}'),
    },
    existsSync: vi.fn(() => true),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(() => '{}'),
}));

import fs from 'fs';

describe('BLE State Persistence', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        resetStateForTesting();
        await initialize();
    });

    it('should save last state when updateDeviceLastState is called', () => {
        const deviceId = 'test-device';
        const state = { power: true, brightness: 75 };

        updateDeviceLastState(deviceId, state);

        const settings = getDeviceSettings(deviceId);
        expect(settings.lastState).toEqual(expect.objectContaining(state));
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should restore last state when device is discovered', () => {
        const deviceId = 'test-device';
        const savedState = { power: true, brightness: 75, colorTemperature: 50 };

        // Mock existing settings in readFileSync
        (fs.readFileSync as any).mockReturnValue(JSON.stringify({
            [deviceId]: { lastState: savedState, saved: true }
        }));

        // Re-initialize to load mocked settings
        resetStateForTesting();
        initialize();

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

    it('should update state when sendLightCommand is successful', async () => {
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

        // Mock writeCharacteristic to succeed (mock mode handles this)
        state.isMockMode = true;

        // In new architecture, we update state through the hub
        await updateDeviceState(deviceId, { brightness: 42 }, 'ui');

        const settings = getDeviceSettings(deviceId);
        expect(settings.lastState?.brightness).toBe(42);
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should NOT save if the state hasn\'t changed', async () => {
        const deviceId = 'unique-test-device';
        const state = { power: true, brightness: 88 };

        // First save
        updateDeviceLastState(deviceId, state);
        expect(fs.writeFileSync).toHaveBeenCalled();

        // Second save with same data
        (fs.writeFileSync as any).mockClear();
        updateDeviceLastState(deviceId, state);
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
});
