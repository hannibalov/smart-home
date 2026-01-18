import { state, emitEvent } from './ble/state';
import { updateDeviceLastState } from './ble/settings';
import { sendLightCommand } from './ble/interaction';
import { sendACCommand, getWiFiDevices } from './ac';
import type { LightState, ACState, ControlCommand, ACControlCommand } from '@/types';

type UpdateSource = 'ui' | 'hardware' | 'system';

/**
 * Main entry point to update any device state
 */
export async function updateDeviceState(
    deviceId: string,
    newState: Partial<LightState | ACState>,
    source: UpdateSource = 'system'
) {
    console.log(`[HUB] Update for ${deviceId} from ${source}:`, newState);

    const bleDevice = state.devices.get(deviceId);
    const wifiDevices = await getWiFiDevices();
    const wifiDevice = wifiDevices.find(d => d.id === deviceId);

    if (!bleDevice && !wifiDevice) {
        console.warn(`[HUB] Device ${deviceId} not found in state, cannot update.`);
        return;
    }

    // 1. Update In-Memory State
    if (bleDevice) {
        bleDevice.state = { ...bleDevice.state, ...newState } as LightState;
        state.devices.set(deviceId, bleDevice);
    } else if (wifiDevice) {
        // Update WiFi device state in our unified map if it's there
        const existing = state.devices.get(deviceId);
        if (existing) {
            existing.state = { ...existing.state, ...newState } as any;
            state.devices.set(deviceId, existing);
        }
    }

    // 2. Watcher: Persistence (Save to JSON)
    // We only persist if it's a meaningful state change
    updateDeviceLastState(deviceId, newState);

    // 3. Watcher: UI (SSE Event)
    emitEvent('device_updated', bleDevice || wifiDevice);

    // 4. Watcher: Hardware Sync
    // We only sync to hardware if the update came from UI or System
    // (If it came from Hardware, it's already in sync)
    if (source !== 'hardware') {
        await syncToHardware(deviceId, newState);
    }
}

/**
 * Dispatch commands to physical devices to match local state
 */
async function syncToHardware(deviceId: string, stateUpdate: Partial<LightState & ACState>) {
    const bleDevice = state.devices.get(deviceId);

    if (bleDevice && bleDevice.connected) {
        console.log(`[HUB] Syncing BLE hardware for ${deviceId}...`);

        // Batch updates or send sequentially
        for (const [key, value] of Object.entries(stateUpdate)) {
            // Mapping state keys to command types
            const type = key as any;
            try {
                await sendLightCommand(deviceId, { type, value: value as any });
            } catch (e) {
                console.error(`[HUB] Failed to sync ${key} for BLE ${deviceId}:`, e);
            }
        }
    } else {
        const wifiDevices = await getWiFiDevices();
        const wifiDevice = wifiDevices.find(d => d.id === deviceId);

        if (wifiDevice && wifiDevice.connected) {
            console.log(`[HUB] Syncing WiFi hardware for ${deviceId}...`);
            for (const [key, value] of Object.entries(stateUpdate)) {
                try {
                    await sendACCommand(deviceId, {
                        type: key as any,
                        value: value as any
                    });
                } catch (e) {
                    console.error(`[HUB] Failed to sync ${key} for WiFi ${deviceId}:`, e);
                }
            }
        }
    }
}
