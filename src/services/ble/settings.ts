
import fs from 'fs';
import path from 'path';
import { state, emitEvent } from './state';
import type { LightState } from '@/types';

// Try to find the project root reliably
const PROJECT_ROOT = process.cwd();
const SETTINGS_FILE = path.resolve(PROJECT_ROOT, 'device-settings.json');

interface DeviceSetting {
    targetChar?: string;
    profileId?: string;
    saved?: boolean;
    customName?: string;
    lastState?: LightState | any; // Any for AC compatibility
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

function ensureLoad() {
    if (!settingsLoaded) {
        loadSettings();
    }
}

/**
 * Persist settings to file
 */
function saveSettings() {
    try {
        const obj = Object.fromEntries(deviceSettings);
        const data = JSON.stringify(obj, null, 2);
        fs.writeFileSync(SETTINGS_FILE, data);
    } catch (e) {
        console.error('[BLE] Failed to save settings:', e);
    }
}

/**
 * Load settings from file
 */
export function loadSettings() {
    if (settingsLoaded) return;
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            const obj = JSON.parse(content);
            Object.entries(obj).forEach(([id, settings]) => {
                deviceSettings.set(id, settings as DeviceSetting);
            });
            console.log(`[SETTINGS] Loaded for ${deviceSettings.size} devices from ${SETTINGS_FILE}`);
        }
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
    saveSettings();

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
    const updated = { ...existing, ...settings };
    deviceSettings.set(deviceId, updated);
    saveSettings();

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
        if (settings.lastState !== undefined) {
            device.state = { ...device.state, ...settings.lastState } as LightState;
        }
        emitEvent('device_updated', device);
    }
}

/**
 * Update the last known state for a device and persist it
 */
export function updateDeviceLastState(deviceId: string, partialState: Partial<LightState> | any) {
    const existing = getDeviceSettings(deviceId);
    const lastState = existing.lastState || {};

    const updatedState = { ...lastState, ...partialState };

    setDeviceSettings(deviceId, { lastState: updatedState });
}

export function getDeviceSettings(deviceId: string) {
    ensureLoad();
    return deviceSettings.get(deviceId) || {};
}
