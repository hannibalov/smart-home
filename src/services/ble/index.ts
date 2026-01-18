
import { state, emitEvent } from './state';
import { loadSettings, getDeviceSettingsMap } from './settings';
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
        if (settings.saved && !state.devices.has(id)) {
            state.devices.set(id, {
                id,
                name: settings.customName || 'Saved Device',
                connected: false,
                rssi: -100,
                services: [],
                lastSeen: Date.now(),
                saved: true,
                customName: settings.customName,
                profileId: settings.profileId,
                targetChar: settings.targetChar,
                state: settings.lastState,
                characteristics: [],
            });
        }
    });
}

/**
 * Start a background loop to reconnect to saved devices
 */
let reconnectInterval: NodeJS.Timeout | null = null;

export function startAutoReconnectLoop() {
    if (reconnectInterval) return;

    console.log('[BLE] Starting auto-reconnect loop (5 min interval)');

    // Initial attempt after a short delay to allow everything to settle
    setTimeout(() => {
        attemptReconnects();
    }, 5000);

    reconnectInterval = setInterval(() => {
        attemptReconnects();
    }, 5 * 60 * 1000); // 5 minutes
}

async function attemptReconnects() {
    const savedDisconnectedDevices = Array.from(state.devices.values())
        .filter(d => d.saved && !d.connected);

    if (savedDisconnectedDevices.length === 0) return;

    console.log(`[BLE] Attempting to reconnect to ${savedDisconnectedDevices.length} saved devices...`);

    // Start a short scan to find them if they are nearby
    try {
        await startScan(10000);
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
