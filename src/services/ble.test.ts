import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    startScan,
    stopScan,
    initialize,
    bleEvents,
    getScanStatus,
    setDeviceSettings,
    getDeviceSettings,
    resetStateForTesting,
    getStateForTesting
} from './ble';
import { EventEmitter } from 'events';

interface MockNoble extends EventEmitter {
    startScanningAsync: () => Promise<void>;
    stopScanningAsync: () => Promise<void>;
    state: string;
}

const mockNoble = new EventEmitter() as MockNoble;
mockNoble.startScanningAsync = vi.fn().mockResolvedValue(undefined);
mockNoble.stopScanningAsync = vi.fn().mockResolvedValue(undefined);
mockNoble.state = 'poweredOn';

// FS Mock
vi.mock('fs', () => ({
    default: {
        existsSync: () => false,
        writeFileSync: vi.fn(),
        readFileSync: () => '{}',
    },
    existsSync: () => false,
    writeFileSync: vi.fn(),
    readFileSync: () => '{}',
}));

describe('BLE Service', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Ensure state is clean
        resetStateForTesting();

        // Inject our mock noble directly into state
        // This bypasses require/import mocking issues with native modules
        const state = getStateForTesting();
        state.noble = mockNoble;
        state.nobleState = 'poweredOn'; // Ensure state aligns
        state.isMockMode = false;      // Ensure we are in "real" mode (but using mock lib)

        // Initialize (should skip loading real noble because state.noble is set)
        await initialize();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('should use the correct mock noble instance', () => {
        const state = getStateForTesting();
        expect(state.noble).toBe(mockNoble);
    });

    describe('Scanning (Mocked Noble)', () => {
        it('should scan and stop on timeout', async () => {
            const emitSpy = vi.spyOn(bleEvents, 'emit');

            // Start scan
            const duration = 500;
            const scanPromise = startScan(duration);

            // Should be scanning immediately
            await scanPromise;

            expect(getScanStatus()).toBe(true);

            expect(emitSpy).toHaveBeenCalledWith('device-event', expect.objectContaining({
                type: 'scan_started',
                payload: expect.any(Object)
            }));

            expect(mockNoble.startScanningAsync).toHaveBeenCalled();

            // Advance time to trigger timeout
            await vi.advanceTimersByTimeAsync(duration + 100);

            // Should be stopped
            expect(getScanStatus()).toBe(false);
            expect(emitSpy).toHaveBeenCalledWith('device-event', expect.objectContaining({
                type: 'scan_stopped',
                payload: expect.any(Object)
            }));

            expect(mockNoble.stopScanningAsync).toHaveBeenCalled();
        });

        it('should handle manual stop', async () => {
            const scanPromise = startScan(10000);
            await scanPromise;

            expect(getScanStatus()).toBe(true);

            await stopScan();

            expect(getScanStatus()).toBe(false);
            expect(mockNoble.stopScanningAsync).toHaveBeenCalled();
        });
    });

    describe('Device Settings', () => {
        it('should save and retrieve device settings', () => {
            const deviceId = 'test-device-1';
            const settings = {
                saved: true,
                profileId: 'rgb-bulb'
            };

            setDeviceSettings(deviceId, settings);

            const retrieved = getDeviceSettings(deviceId);
            expect(retrieved).toEqual(expect.objectContaining(settings));
        });
    });
});
