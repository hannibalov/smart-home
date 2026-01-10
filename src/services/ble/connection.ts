
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

import { getLightState } from './interaction';

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

    try {
        // Stop scanning before connecting (required by noble)
        await stopScan();

        // Connect
        await peripheral.connectAsync();
        console.log(`[BLE] Connected to ${device.name}`);

        const { services, characteristics: chars } = await peripheral.discoverAllServicesAndCharacteristicsAsync();

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

        console.log(`[CONNECTION] Device connected, attempting to read initial state...`);
        try {
            const initialState = await getLightState(deviceId);
            console.log(`[CONNECTION] Initial state retrieved:`, initialState);

            if (Object.keys(initialState).length > 0) {
                device.state = {
                    power: initialState.power ?? false,
                    brightness: initialState.brightness ?? 100,
                    colorTemperature: initialState.colorTemperature ?? 50,
                    ...initialState
                } as LightState;
                console.log(`[CONNECTION] Device state updated:`, device.state);
                emitEvent('device_updated', device);
            } else {
                console.log(`[CONNECTION] No state data retrieved (empty object)`);
            }
        } catch (e) {
            console.error(`[CONNECTION] Failed to read initial state for ${device.name}:`, e);
            if (e instanceof Error) {
                console.error(`[CONNECTION] Error stack:`, e.stack);
            }
        }

        return device;
    } catch (error) {
        console.error(`[BLE] Connection failed:`, error);
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
