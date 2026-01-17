
import fs from 'fs';
import path from 'path';
import { state, emitEvent } from './state';
import type { LightState } from '@/types';

interface DeviceSetting {
    targetChar?: string;
    profileId?: string;
    saved?: boolean;
    customName?: string;
    lastState?: LightState;
}

const SETTINGS_FILE = path.join(process.cwd(), 'device-settings.json');
const deviceSettings = new Map<string, DeviceSetting>();

/**
 * Persist settings to file
 */
function saveSettings() {
    try {
        const obj = Object.fromEntries(deviceSettings);
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(obj, null, 2));
    } catch (e) {
        console.error('[BLE] Failed to save settings:', e);
    }
}

/**
 * Load settings from file
 */
export function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            const obj = JSON.parse(content);
            Object.entries(obj).forEach(([id, settings]) => {
                deviceSettings.set(id, settings as DeviceSetting);
            });
            console.log(`[BLE] Loaded settings for ${deviceSettings.size} devices`);
        }
    } catch (e) {
        console.error('[BLE] Failed to load settings:', e);
    }
}

export function getDeviceSettingsMap() {
    return deviceSettings;
}

export function toggleSaveDevice(deviceId: string) {
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
export function updateDeviceLastState(deviceId: string, partialState: Partial<LightState>) {
    const existing = deviceSettings.get(deviceId) || {};
    const lastState = existing.lastState || { power: false, brightness: 100, colorTemperature: 50 };

    const updatedState = { ...lastState, ...partialState };

    setDeviceSettings(deviceId, { lastState: updatedState });
}

export function getDeviceSettings(deviceId: string) {
    return deviceSettings.get(deviceId) || {};
}
