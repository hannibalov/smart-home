import { ACState, ACControlCommand, WiFiDevice, DeviceType, DeviceConnectivity } from '@/types';
import { getDeviceSettingsMap } from './ble/settings';
import { updateDeviceState } from './hub';

// In-memory state for WiFi devices
const wifiDevices = new Map<string, WiFiDevice>();
const acStates = new Map<string, ACState>();

/**
 * Initialize WiFi devices from settings
 */
function ensureDevices() {
    if (wifiDevices.size > 0) return;

    const settingsMap = getDeviceSettingsMap();
    settingsMap.forEach((settings, id) => {
        const isWifi = id.includes('.') || id.startsWith('192.') || id.startsWith('10.');
        if (isWifi) {
            const device: WiFiDevice = {
                id,
                name: settings.customName || 'WiFi AC',
                ip: id,
                type: (settings.type as DeviceType) || 'ac',
                connectivity: (settings.connectivity as DeviceConnectivity) || 'wifi',
                protocol: settings.protocol || 'tuya',
                connected: true,
                lastSeen: Date.now(),
            };
            wifiDevices.set(id, device);

            const lastState = settings.lastState as ACState | undefined;
            acStates.set(id, {
                power: lastState?.power ?? false,
                targetTemp: lastState?.targetTemp ?? 22,
                currentTemp: lastState?.currentTemp ?? 24,
                mode: lastState?.mode ?? 'cool',
                fanSpeed: lastState?.fanSpeed ?? 'auto',
                swing: lastState?.swing ?? false,
            });
        }
    });

    // Fallback mock if nothing saved
    if (wifiDevices.size === 0) {
        const mockId = '192.168.1.50';
        wifiDevices.set(mockId, {
            id: mockId,
            name: 'Mock AC',
            ip: mockId,
            type: 'ac',
            connectivity: 'wifi',
            protocol: 'tuya',
            connected: true,
            lastSeen: Date.now(),
        });
        acStates.set(mockId, {
            power: false,
            targetTemp: 22,
            currentTemp: 24,
            mode: 'cool',
            fanSpeed: 'auto',
            swing: false,
        });
    }
}

/**
 * Get all WiFi devices
 */
export async function getWiFiDevices(): Promise<WiFiDevice[]> {
    ensureDevices();
    return Array.from(wifiDevices.values());
}

/**
 * Get AC state
 */
export async function getACState(deviceId: string): Promise<ACState | undefined> {
    ensureDevices();
    return acStates.get(deviceId);
}

/**
 * Send command to AC
 */
export async function sendACCommand(
    deviceId: string,
    command: ACControlCommand
): Promise<boolean> {
    ensureDevices();
    const state = acStates.get(deviceId);
    if (!state) return false;

    console.log(`[AC] Sending command to ${deviceId}:`, command);

    const newState = { [command.type]: command.value };
    await updateDeviceState(deviceId, newState, 'hardware');

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
