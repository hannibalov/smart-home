import { state, emitEvent } from './state';
import type { LightState, DeviceType, DeviceConnectivity, DeviceProtocol } from '@/types';
import { loadDevicesFromDb, saveDeviceToDb } from '../db'; // Ensure this path is correct relative to src/services/ble/settings.ts

interface DeviceSetting {
    targetChar?: string;
    profileId?: string;
    saved?: boolean;
    customName?: string;
    type?: DeviceType;
    connectivity?: DeviceConnectivity;
    protocol?: DeviceProtocol;
    lastState?: LightState | unknown;
}

// Ensure the settings map survives Next.js hot-reloads
const globalForSettings = global as unknown as {
    deviceSettings: Map<string, DeviceSetting>;
    settingsLoaded: boolean;
};

const deviceSettings = globalForSettings.deviceSettings || new Map<string, DeviceSetting>();
if (!globalForSettings.deviceSettings) globalForSettings.deviceSettings = deviceSettings;

let settingsLoaded = globalForSettings.settingsLoaded || false;
function setSettingsLoaded(val: boolean) {
    settingsLoaded = val;
    globalForSettings.settingsLoaded = val;
}

export function resetSettingsForTesting() {
    deviceSettings.clear();
    setSettingsLoaded(false);
}

function ensureLoad() {
    if (!settingsLoaded) {
        // This is async in reality, but for the synchronous map access pattern we trigger it 
        // and let it settle. In a real app we might want to await this during startup.
        loadSettings();
    }
}

/**
 * Persist settings to DB
 */
function saveSettings(deviceId: string, reason?: string) {
    try {
        const settings = deviceSettings.get(deviceId);
        if (settings) {
            console.log(`[SETTINGS] Saving ${reason ? `for ${reason} ` : ''}to DB for ${deviceId}`);
            // Fire and forget save
            saveDeviceToDb(deviceId, settings as unknown as Record<string, unknown>);
        }
    } catch (e) {
        console.error('[BLE] Failed to save settings:', e);
    }
}

/**
 * Load settings from DB
 */
export async function loadSettings() {
    if (settingsLoaded) return;
    try {
        console.log('[SETTINGS] Loading from DB...');
        const dbDevices = await loadDevicesFromDb();
        Object.entries(dbDevices).forEach(([id, settings]) => {
            deviceSettings.set(id, settings as DeviceSetting);
        });
        console.log(`[SETTINGS] Loaded for ${deviceSettings.size} devices from DB`);
        setSettingsLoaded(true);
    } catch (e) {
        console.error('[SETTINGS] Failed to load:', e);
    }
}

export function getDeviceSettingsMap() {
    ensureLoad();
    return deviceSettings;
}

export function toggleSaveDevice(deviceId: string) {
    ensureLoad();
    const settings = deviceSettings.get(deviceId) || {};
    settings.saved = !settings.saved;
    deviceSettings.set(deviceId, settings);
    saveSettings(deviceId, 'toggleSave');

    // Also update the device object in memory if it exists
    const device = state.devices.get(deviceId);
    if (device) {
        device.saved = settings.saved;
        emitEvent('device_updated', device);
    }

    return settings.saved;
}

export function setDeviceSettings(deviceId: string, settings: DeviceSetting) {
    ensureLoad();
    const existing = deviceSettings.get(deviceId) || {};

    // Check for actual changes to prevent unnecessary writes
    const keys = Object.keys(settings) as (keyof DeviceSetting)[];
    const hasChanged = keys.some(key => {
        const isChanged = JSON.stringify(existing[key]) !== JSON.stringify(settings[key]);
        return isChanged;
    });

    if (!hasChanged) {
        console.log(`[SETTINGS] Change detection: No changes for ${deviceId}, skipping DB write.`);
        return;
    }

    const updated = { ...existing, ...settings };
    deviceSettings.set(deviceId, updated);
    saveSettings(deviceId, 'update');

    // Also update the device object in memory if it exists
    const device = state.devices.get(deviceId);
    if (device) {
        if (settings.profileId !== undefined) device.profileId = settings.profileId;
        if (settings.targetChar !== undefined) device.targetChar = settings.targetChar;
        if (settings.saved !== undefined) device.saved = settings.saved;
        if (settings.customName !== undefined) {
            device.customName = settings.customName;
            // Also update the display name if currently connected/viewed
            device.name = settings.customName;
        }
        if (settings.type !== undefined) device.type = settings.type;
        if (settings.connectivity !== undefined) device.connectivity = settings.connectivity;
        if (settings.protocol !== undefined) device.protocol = settings.protocol;
        if (settings.lastState !== undefined) {
            device.state = { ...device.state, ...settings.lastState } as LightState;
        }
        emitEvent('device_updated', device);
    }
}

/**
 * Update the last known state for a device and persist it
 */
export function updateDeviceLastState(deviceId: string, partialState: Partial<LightState> | unknown) {
    const existing = getDeviceSettings(deviceId);
    const lastState = (existing.lastState || {}) as Record<string, unknown>;

    const updatedState = { ...(lastState as Record<string, unknown>), ...((partialState as Record<string, unknown>) || {}) } as Record<string, unknown>;

    setDeviceSettings(deviceId, { lastState: updatedState });
}

export function getDeviceSettings(deviceId: string) {
    ensureLoad();
    return deviceSettings.get(deviceId) || {};
}

