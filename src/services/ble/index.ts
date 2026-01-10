
import { state } from './state';
import { loadSettings } from './settings';
import { handleDiscover } from './discovery';

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
