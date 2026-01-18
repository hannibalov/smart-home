import { ACState, ACControlCommand, WiFiDevice } from '@/types';
import { updateDeviceLastState, getDeviceSettings } from './ble/settings';

// In-memory state for WiFi devices
const wifiDevices = new Map<string, WiFiDevice>();
const acStates = new Map<string, ACState>();

/**
 * Initialize mock AC if none exists
 */
function ensureMockAC() {
    if (wifiDevices.size === 0) {
        const mockAC: WiFiDevice = {
            id: '192.168.1.50',
            name: 'Pro Klima AC (Living Room)',
            ip: '192.168.1.50',
            type: 'ac',
            connected: true,
            lastSeen: Date.now(),
        };
        const settings = getDeviceSettings(mockAC.id);
        const lastState = settings.lastState as ACState;

        wifiDevices.set(mockAC.id, mockAC);
        acStates.set(mockAC.id, {
            power: lastState?.power ?? false,
            targetTemp: lastState?.targetTemp ?? 22,
            currentTemp: lastState?.currentTemp ?? 24,
            mode: lastState?.mode ?? 'cool',
            fanSpeed: lastState?.fanSpeed ?? 'auto',
            swing: lastState?.swing ?? false,
        });
    }
}

/**
 * Get all WiFi devices
 */
export async function getWiFiDevices(): Promise<WiFiDevice[]> {
    ensureMockAC();
    return Array.from(wifiDevices.values());
}

/**
 * Get AC state
 */
export async function getACState(deviceId: string): Promise<ACState | undefined> {
    ensureMockAC();
    return acStates.get(deviceId);
}

/**
 * Send command to AC
 */
export async function sendACCommand(
    deviceId: string,
    command: ACControlCommand
): Promise<boolean> {
    ensureMockAC();
    const state = acStates.get(deviceId);
    if (!state) return false;

    console.log(`[AC] Sending command to ${deviceId}:`, command);

    // Update local state
    switch (command.type) {
        case 'power':
            state.power = command.value as boolean;
            break;
        case 'targetTemp':
            state.targetTemp = command.value as number;
            break;
        case 'mode':
            state.mode = command.value as ACState['mode'];
            break;
        case 'fanSpeed':
            state.fanSpeed = command.value as ACState['fanSpeed'];
            break;
        case 'swing':
            state.swing = command.value as boolean;
            break;
    }

    acStates.set(deviceId, { ...state });

    // Persist AC state
    updateDeviceLastState(deviceId, state);

    // TODO: Implement real Tuya/WiFi communication here
    // For now, we simulate success
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`[AC] Command successful. New state:`, state);
    return true;
}
