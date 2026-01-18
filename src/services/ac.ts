import { ACState, ACControlCommand, WiFiDevice } from '@/types';
import { getDeviceSettings } from './ble/settings';
import { updateDeviceState } from './hub';

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

    const newState = { [command.type]: command.value };
    await updateDeviceState(deviceId, newState, 'ui');

    // Update local state is now handled by Hub (via updateDeviceState)
    // but ac.ts keeps its own map for quick access/non-BLE devices
    const currentACState = acStates.get(deviceId);
    if (currentACState) {
        acStates.set(deviceId, { ...currentACState, ...newState });
    }

    // TODO: Implement real Tuya/WiFi communication here
    // For now, we simulate success
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`[AC] Command successful. New state:`, state);
    return true;
}
