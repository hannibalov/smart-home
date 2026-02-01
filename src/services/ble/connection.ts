
import type { DeviceDetails, LightState, BLECharacteristic } from '@/types';
import type { Characteristic } from './types';
import { state, emitEvent } from './state';
import { createMockCharacteristics } from './mock';
import { stopScan } from './discovery';

// Circular dependency workaround: getLightState is likely used/imported here in original monolithic file.
// Assuming getLightState calls readCharacteristic which is in interaction.
// However, in the original file, correct logic for getLightState was implicit or I missed it.
// Looking at original file, getLightState isn't defined there! Wait.
// Ah, `getLightState` was used in `connectDevice` in the original file (line 470).
// But `getLightState` was NOT defined in the viewed lines of `ble.ts`.
// It must have been imported or defined further down.
// It might be imported but imports list:
// import type { ... } from '@/types';
// import { PROFILES } from '@/profiles';
// It's not imported. So it must be defined in the file.
// I probably missed it in `ble.ts` because it was below line 800? 
// Yes, I only viewed 800 lines. The original file had 985 lines.

// I will check the file content first to find `getLightState`.

import { getLightState, sendLightCommand } from './interaction';
import { getDeviceSettings } from './settings';

/**
 * Connect to a device
 */
export async function connectDevice(deviceId: string): Promise<DeviceDetails> {
    const device = state.devices.get(deviceId);
    if (!device) {
        console.error(`[BLE] Connection failed: ID ${deviceId} not found in map. Current keys: ${Array.from(state.devices.keys()).join(', ')}`);
        throw new Error(`Device not found (ID: ${deviceId}). The server likely restarted and lost its state. Please RE-SCAN and try again.`);
    }

    if (device.connected) {
        return device;
    }

    if (state.isMockMode) {
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 800));

        device.connected = true;
        device.characteristics = createMockCharacteristics();
        state.devices.set(deviceId, device);

        emitEvent('device_connected', device);
        return device;
    }

    // Real BLE connection
    const peripheral = state.peripherals.get(deviceId);
    if (!peripheral) {
        throw new Error(`Peripheral not found for device: ${deviceId}`);
    }

    console.log(`[BLE] Connecting to ${device.name}...`);
    const startTime = performance.now();

    try {
        // Stop scanning before connecting (required by noble)
        if (state.isScanning) {
            console.log(`[BLE] Stopping scan before connection...`);
            const stopScanStart = performance.now();
            await stopScan();
            console.log(`[BLE] stopScan took ${(performance.now() - stopScanStart).toFixed(2)}ms`);
        } else {
            console.log(`[BLE] Scan already stopped, skipping stopScan()`);
        }

        // Connect
        console.log(`[BLE] Calling peripheral.connectAsync()...`);
        const connectStart = performance.now();
        await peripheral.connectAsync();
        console.log(`[BLE] connectAsync took ${(performance.now() - connectStart).toFixed(2)}ms`);

        console.log(`[BLE] Discovering services and characteristics...`);
        const discoverStart = performance.now();
        const { services, characteristics: chars } = await peripheral.discoverAllServicesAndCharacteristicsAsync();
        console.log(`[BLE] discovery took ${(performance.now() - discoverStart).toFixed(2)}ms`);

        const serviceUuids = new Set<string>();
        for (const service of services) {
            const uuid = service.uuid.toLowerCase().replace(/-/g, '');
            serviceUuids.add(uuid);
        }

        const charMap = new Map<string, Characteristic>();
        const bleChars: BLECharacteristic[] = [];

        for (const char of chars) {
            charMap.set(char.uuid, char);
            const charWithInternal = char as unknown as { _serviceUuid?: string };
            const serviceUuid = charWithInternal._serviceUuid || 'unknown';
            const normalizedServiceUuid = serviceUuid.toLowerCase().replace(/-/g, '');
            if (normalizedServiceUuid !== 'unknown') {
                serviceUuids.add(normalizedServiceUuid);
            }
            bleChars.push({
                uuid: char.uuid,
                serviceUuid,
                properties: char.properties || [],
            });
        }

        state.characteristics.set(deviceId, charMap);

        device.connected = true;
        device.characteristics = bleChars;
        device.services = Array.from(serviceUuids);
        state.devices.set(deviceId, device);

        // Handle disconnect event
        peripheral.once('disconnect', () => {
            console.log(`[BLE] Device ${device.name} disconnected`);
            device.connected = false;
            device.characteristics = [];
            state.devices.set(deviceId, device);
            state.characteristics.delete(deviceId);
            emitEvent('device_disconnected', { id: deviceId });
        });

        emitEvent('device_connected', device);
        emitEvent('device_updated', device); // Notify UI that connection status changed

        console.log(`[CONNECTION] Device connected, attempting to read initial state...`);
        try {
            const settings = getDeviceSettings(deviceId);
            const initialState = await getLightState(deviceId);
            console.log(`[CONNECTION] Initial state retrieved:`, initialState);

            // Restore saved state if it exists and we have a last known state
            const lastState = settings.lastState as Partial<LightState> | undefined;
            if (lastState) {
                console.log(`[CONNECTION] Restoring saved state for ${device.name}:`, lastState);

                // Restore power first if it was on
                if (lastState.power) {
                    await sendLightCommand(deviceId, { type: 'power', value: true });

                    // Restore other properties if they exist
                    if (lastState.brightness !== undefined) {
                        await sendLightCommand(deviceId, { type: 'brightness', value: lastState.brightness });
                    }
                    if (lastState.color) {
                        await sendLightCommand(deviceId, { type: 'color', value: lastState.color });
                    }
                    if (lastState.colorTemperature !== undefined) {
                        await sendLightCommand(deviceId, { type: 'colorTemperature', value: lastState.colorTemperature });
                    }
                } else {
                    // Just ensure it's off if it was off
                    await sendLightCommand(deviceId, { type: 'power', value: false });
                }
            }

            if (Object.keys(initialState).length > 0) {
                device.state = {
                    power: initialState.power ?? lastState?.power ?? false,
                    brightness: initialState.brightness ?? lastState?.brightness ?? 100,
                    colorTemperature: initialState.colorTemperature ?? lastState?.colorTemperature ?? 50,
                    ...lastState,
                    ...initialState
                } as LightState;
                console.log(`[CONNECTION] Device state updated:`, device.state);
                emitEvent('device_updated', device);
            } else if (settings.lastState) {
                // If we couldn't read the state but we have a last known state, use that
                device.state = { ...(lastState || {}) } as LightState;
                emitEvent('device_updated', device);
            }
        } catch (e) {
            console.error(`[CONNECTION] Failed to read initial state for ${device.name}:`, e);
            if (e instanceof Error) {
                console.error(`[CONNECTION] Error stack:`, e.stack);
            }
        }

        console.log(`[BLE] Total connection flow for ${device.name} took ${(performance.now() - startTime).toFixed(2)}ms`);
        return device;
    } catch (error) {
        console.error(`[BLE] Connection failed after ${(performance.now() - startTime).toFixed(2)}ms:`, error);
        throw error;
    }
}

/**
 * Disconnect from a device
 */
export async function disconnectDevice(deviceId: string): Promise<void> {
    const device = state.devices.get(deviceId);
    if (!device) {
        throw new Error(`Device not found: ${deviceId}`);
    }

    if (!device.connected) {
        return;
    }

    if (state.isMockMode) {
        await new Promise(resolve => setTimeout(resolve, 200));

        device.connected = false;
        device.characteristics = [];
        state.devices.set(deviceId, device);

        emitEvent('device_disconnected', { id: deviceId });
        return;
    }

    // Real BLE disconnection
    const peripheral = state.peripherals.get(deviceId);
    if (peripheral) {
        try {
            await peripheral.disconnectAsync();
            console.log(`[BLE] Disconnected from ${device.name}`);
        } catch (error) {
            console.error('[BLE] Disconnect error:', error);
        }
    }

    device.connected = false;
    device.characteristics = [];
    state.devices.set(deviceId, device);
    state.characteristics.delete(deviceId);
    emitEvent('device_disconnected', { id: deviceId });
}
