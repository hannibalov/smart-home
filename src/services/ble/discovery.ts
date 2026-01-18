
import type { Peripheral } from './types';
import { state, emitEvent } from './state';
import { getDeviceSettingsMap, getDeviceSettings } from './settings';
import { connectDevice } from './connection';
import { createMockDevices } from './mock';
import type { BLEDevice, DeviceDetails } from '@/types';

/**
 * Convert noble peripheral to our BLEDevice type
 */
function peripheralToDevice(peripheral: Peripheral): BLEDevice {
    const advertisement = peripheral.advertisement || {};
    const serviceUuids = advertisement.serviceUuids || [];
    const deviceSettings = getDeviceSettingsMap();
    const settings = deviceSettings.get(peripheral.id) || {};

    // Heuristic: if it has our target service a032, it's likely the light
    let name = settings.customName || advertisement.localName || 'Unknown Device';

    if (!settings.customName && name === 'Unknown Device' && serviceUuids.some(uuid => uuid.toLowerCase().includes('a032'))) {
        name = 'ilink? (Service A032)';
    }

    return {
        id: peripheral.id,
        name: name,
        rssi: peripheral.rssi || -100,
        connected: peripheral.state === 'connected',
        services: serviceUuids,
        lastSeen: Date.now(),
        saved: !!settings.saved,
        customName: settings.customName,
    };
}

/**
 * Handle discovered peripheral
 */
export function handleDiscover(peripheral: Peripheral): void {
    const device = peripheralToDevice(peripheral);

    // Store peripheral reference for later connection
    state.peripherals.set(peripheral.id, peripheral);

    // Check if device already exists
    const existing = state.devices.get(device.id);
    if (existing) {
        // Update existing device
        state.devices.set(device.id, {
            ...existing,
            name: device.name !== 'Unknown Device' ? device.name : existing.name,
            rssi: device.rssi,
            lastSeen: device.lastSeen,
        });
    } else {
        // New device
        const settings = getDeviceSettings(device.id);
        state.devices.set(device.id, {
            ...device,
            profileId: settings.profileId,
            targetChar: settings.targetChar,
            saved: !!settings.saved,
            state: settings.lastState,
            characteristics: [],
        });

        emitEvent('device_discovered', device);
    }

    // 4. Auto-connect to saved devices when discovered
    const settings = getDeviceSettings(device.id);
    if (settings.saved && !peripheral.state.includes('connected')) {
        console.log(`[BLE] Discovered saved device ${device.name}(${device.id}), connecting...`);
        connectDevice(device.id).catch(err => {
            console.error(`[BLE] Auto-connect failed for ${device.id}:`, err);
        });

        // Optimization: if we were scanning specifically for saved devices,
        // stop as soon as we found all of them
        if (state.scanType === 'auto') {
            const savedDisconnected = Array.from(state.devices.values())
                .filter(d => d.saved && !d.connected);

            const peripheralsKnown = savedDisconnected.every(d => state.peripherals.has(d.id));

            if (peripheralsKnown) {
                console.log('[BLE] All saved devices found or known, stopping auto-scan early.');
                stopScan().catch(err => console.error('[BLE] Failed to stop scan:', err));
            }
        }
    }

    // Always emit an update if it was an existing device (to refresh RSSI/lastSeen in UI)
    if (existing) {
        emitEvent('device_updated', state.devices.get(device.id));
    }
}

/**
 * Get all discovered devices
 */
export function getDevices(): BLEDevice[] {
    return Array.from(state.devices.values())
        .filter(device => {
            // Filter out WiFi devices from the BLE list to avoid duplication in API
            const isWifi = device.id.includes('.') || device.id.startsWith('192.') || device.id.startsWith('10.');
            return !isWifi;
        })
        .map((device) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { characteristics, ...rest } = device;
            return rest;
        });
}

/**
 * Get device details by ID
 */
export function getDevice(deviceId: string): DeviceDetails | undefined {
    return state.devices.get(deviceId);
}

/**
 * Stop ongoing scan
 */
export async function stopScan(): Promise<void> {
    if (state.scanTimeout) {
        clearTimeout(state.scanTimeout);
        state.scanTimeout = null;
    }

    if (!state.isScanning) return;

    if (!state.isMockMode && state.noble) {
        try {
            await state.noble.stopScanningAsync();
            console.log('[BLE] Scanning stopped');
        } catch (error) {
            console.error('[BLE] Error stopping scan:', error);
        }
    }

    state.isScanning = false;
    state.scanType = null;
    emitEvent('scan_stopped', { devicesFound: state.devices.size });
}

/**
 * Start scanning for BLE devices
 */
export async function startScan(
    durationMs: number = 10000,
    type: 'manual' | 'auto' = 'manual'
): Promise<BLEDevice[]> {
    if (state.isScanning) {
        console.log(`[BLE] Scan requested (${type}) but already in progress (${state.scanType}). Returning current devices.`);
        return getDevices();
    }

    state.isScanning = true;
    state.scanType = type;
    emitEvent('scan_started', { durationMs, type });

    if (state.isMockMode) {
        // Simulate scan delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockDevices = createMockDevices();
        mockDevices.forEach(device => {
            if (!state.devices.has(device.id)) {
                state.devices.set(device.id, {
                    ...device,
                    characteristics: [],
                });
                emitEvent('device_discovered', device);
            }

            // Auto-connect to saved devices in mock mode
            const settings = getDeviceSettings(device.id);
            if (settings.saved && !device.connected) {
                console.log(`[BLE] Mock auto-connecting to saved device: ${device.id}`);
                connectDevice(device.id).catch(() => { });
            }
        });

        // Simulate scan completion
        await new Promise(resolve => setTimeout(resolve, Math.min(durationMs - 1500, 3000)));
        state.isScanning = false;
        emitEvent('scan_stopped', { devicesFound: state.devices.size });

        return getDevices();
    }

    // Real BLE scanning
    if (!state.noble) {
        state.isScanning = false;
        throw new Error('Noble not initialized');
    }

    // Wait for adapter to be powered on
    if (state.nobleState !== 'poweredOn') {
        console.log(`[BLE] Waiting for adapter (current state: ${state.nobleState})`);
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Bluetooth adapter not ready (state: ${state.nobleState})`));
            }, 5000);

            const checkState = () => {
                if (state.nobleState === 'poweredOn') {
                    clearTimeout(timeout);
                    resolve();
                }
            };

            state.noble!.on('stateChange', (s) => {
                state.nobleState = s;
                checkState();
            });
            checkState();
        });
    }

    // Start scanning
    try {
        await state.noble.startScanningAsync([], true); // All UUIDs, allow duplicates
        console.log('[BLE] Scanning started');

        // Set scan timeout
        state.scanTimeout = setTimeout(async () => {
            await stopScan();
        }, durationMs);

        // Return current devices (will be populated by discover events)
        return getDevices();
    } catch (error) {
        state.isScanning = false;
        emitEvent('scan_stopped', { devicesFound: state.devices.size, error: error instanceof Error ? error.message : String(error) });
        console.error('[BLE] Failed to start scan:', error);
        throw error;
    }
}
