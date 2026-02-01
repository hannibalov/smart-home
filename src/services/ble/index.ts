
import { state } from './state';
import type { LightState } from '@/types';
import { loadSettings, getDeviceSettingsMap, resetSettingsForTesting } from './settings';
import { handleDiscover, startScan } from './discovery';
import { connectDevice } from './connection';

// Re-export everything from modules
export * from './types';
export * from './state';
export * from './settings';
export * from './encoding';
export * from './mock';
export * from './discovery';
export * from './connection';
export * from './interaction';

// Helper for command log
export function getCommandLog(limit: number = 50) {
    return state.commandLog.slice(-limit);
}

export function clearCommandLog(): void {
    state.commandLog.length = 0;
}

/**
 * Pre-populate the device map with saved devices from settings
 */
function populateSavedDevices() {
    const settingsMap = getDeviceSettingsMap();
    settingsMap.forEach((settings, id) => {
        if (!state.devices.has(id)) {
            // Check if it's a WiFi device ID (IP format)
            const isWifi = id.includes('.') || id.startsWith('192.') || id.startsWith('10.');

            if (settings.saved || isWifi) {
                state.devices.set(id, {
                    id,
                    name: settings.customName || (isWifi ? 'WiFi AC' : 'Saved Device'),
                    connected: isWifi ? true : false, // WiFi devices are generally available via IP
                    rssi: -100,
                    services: [],
                    lastSeen: Date.now(),
                    saved: !!settings.saved,
                    customName: settings.customName,
                    profileId: settings.profileId,
                    targetChar: settings.targetChar,
                    state: settings.lastState as unknown as LightState | undefined,
                    characteristics: [],
                });
            }
        }
    });
}

/**
 * Start a background loop to reconnect to saved devices
 */
let reconnectInterval: NodeJS.Timeout | null = null;

export function startAutoReconnectLoop() {
    if (reconnectInterval) return;

    console.log('[BLE] Starting auto-reconnect loop (30s interval)');

    // Initial attempt after a short delay
    setTimeout(() => {
        attemptReconnects();
    }, 2000);

    reconnectInterval = setInterval(() => {
        attemptReconnects();
    }, 30 * 1000); // 30 seconds
}

async function attemptReconnects() {
    const savedDisconnectedDevices = Array.from(state.devices.values())
        .filter(d => d.saved && !d.connected);

    if (savedDisconnectedDevices.length === 0) return;

    // 1. Try to connect directly to devices we already have peripherals for
    const stillNeeded: string[] = [];
    for (const device of savedDisconnectedDevices) {
        if (state.peripherals.has(device.id)) {
            console.log(`[BLE] Reconnecting to ${device.name} (peripheral known)...`);
            connectDevice(device.id).catch(() => { });
        } else {
            stillNeeded.push(device.id);
        }
    }

    if (stillNeeded.length === 0) {
        console.log('[BLE] All saved devices have known peripherals, skipping scan.');
        return;
    }

    console.log(`[BLE] Attempting to find ${stillNeeded.length} devices via brief auto-scan...`);

    // 2. Only scan if we have saved devices that aren't in our peripheral map
    try {
        // Start a short scan. handleDiscover will handle the connection and early stop.
        await startScan(15000, 'auto');
    } catch (e) {
        console.error('[BLE] Auto-reconnect scan failed:', e);
    }
}

export function resetStateForTesting() {
    state.noble = null;
    state.isMockMode = false;
    state.nobleState = 'unknown';
    state.devices.clear();
    state.peripherals.clear();
    state.characteristics.clear();
    state.commandLog = [];
    state.isScanning = false;
    if (state.scanTimeout) clearTimeout(state.scanTimeout);
    state.scanTimeout = null;
    state.bleEvents.removeAllListeners();
    resetSettingsForTesting();
}

export function getStateForTesting() {
    return state;
}

/**
 * Initialize the BLE service
 */
export async function initialize(): Promise<{ mockMode: boolean; adapterState: string }> {
    if (state.noble || state.isMockMode) {
        return { mockMode: state.isMockMode, adapterState: state.nobleState };
    }

    console.log('[BLE] Initializing...');
    loadSettings();
    populateSavedDevices();
    startAutoReconnectLoop();

    try {
        const platform = process.platform;
        if (platform !== 'darwin' && platform !== 'linux' && platform !== 'win32') {
            console.log('[BLE] Platform not supported for real BLE, using mock mode');
            state.isMockMode = true;
            return { mockMode: true, adapterState: 'unsupported' };
        }

        if (process.env.NEXT_PUBLIC_USE_MOCK_BLE === 'true') {
            console.log('[BLE] Forced mock mode via env');
            state.isMockMode = true;
            return { mockMode: true, adapterState: 'unknown' };
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const nobleLib = require('@abandonware/noble');
            state.noble = nobleLib;

            // Set up state change handler
            state.noble!.on('stateChange', (s: string) => {
                console.log(`[BLE] Adapter state changed: ${s}`);
                state.nobleState = s;
            });

            // Set up discover handler
            state.noble!.on('discover', handleDiscover);

            // Get current state
            state.nobleState = (state.noble as unknown as { state: string }).state;
            console.log(`[BLE] Noble loaded, adapter state: ${state.nobleState}`);

            state.isMockMode = false;
        } catch (error) {
            console.log('[BLE] Noble not available, using mock mode:', error);
            state.isMockMode = true;
        }
    } catch (error) {
        console.log('[BLE] Fatal error initializing, using mock mode:', error);
        state.isMockMode = true;
    }

    return { mockMode: state.isMockMode, adapterState: state.nobleState };
}
