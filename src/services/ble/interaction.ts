
import type { CommandLogEntry, LightState, ControlCommand, BLECharacteristic } from '@/types';
import { state, emitEvent, generateId } from './state';
import { getDeviceSettings, updateDeviceLastState } from './settings';
import { PROFILES } from '@/profiles';
import { encodeILinkCommand, encodeTrionesCommand, encodeMagicHomeCommand } from './encoding';

function parseILinkStatus(hex: string): Partial<LightState> {
    console.log(`[STATE] parseILinkStatus: Parsing hex=${hex}`);

    if (!hex.startsWith('55aa')) {
        console.log(`[STATE] parseILinkStatus: Hex does not start with 55aa, returning empty`);
        return {};
    }

    const cid = hex.substring(6, 10);
    const data = hex.substring(10, hex.length - 2);
    const len = parseInt(hex.substring(4, 6), 16);

    console.log(`[STATE] parseILinkStatus: CID=${cid}, len=${len}, data=${data}, dataLength=${data.length}`);

    if (cid === '8815' || cid === '8814') {
        if (data.length < 8) {
            console.log(`[STATE] parseILinkStatus: Data too short (${data.length}), expected at least 8 chars`);
            return {};
        }

        const r = parseInt(data.substring(0, 2), 16);
        const g = parseInt(data.substring(2, 4), 16);
        const b = parseInt(data.substring(4, 6), 16);
        const brightnessRaw = parseInt(data.substring(6, 8), 16);
        const brightness = Math.floor(brightnessRaw / 2.55);

        const result = {
            power: true,
            brightness: brightness || 100,
            color: { r, g, b }
        } as Partial<LightState>;

        console.log(`[STATE] parseILinkStatus: Parsed RGB(${r},${g},${b}), brightness=${brightness}% (raw=${brightnessRaw})`);
        return result;
    }

    if (cid === '8425') {
        console.log(`[STATE] parseILinkStatus: CID 8425 detected (static info), ignoring`);
        return {};
    }

    console.log(`[STATE] parseILinkStatus: Unknown CID ${cid}, returning empty`);
    return {};
}

/**
 * Get the current state of a light
 */
export async function getLightState(deviceId: string): Promise<Partial<LightState>> {
    const device = state.devices.get(deviceId);
    if (!device) {
        console.log(`[STATE] getLightState: Device ${deviceId} not found in state`);
        return {};
    }

    console.log(`[STATE] getLightState: Starting state retrieval for device ${device.name} (${deviceId})`);
    console.log(`[STATE] Device services:`, device.services);
    console.log(`[STATE] Device characteristics:`, device.characteristics?.map(c => `${c.uuid} (service: ${c.serviceUuid}, props: ${c.properties.join(',')})`));

    const settings = getDeviceSettings(deviceId);
    const profileId = settings.profileId || (device.services.includes('a032') ? 'ilink' : 'generic');
    const profile = PROFILES.find(p => p.id === profileId);

    console.log(`[STATE] Profile detection: profileId=${profileId}, profile=${profile?.id}, statusChar=${profile?.statusChar}`);

    if (!profile || !profile.statusChar) {
        console.log(`[STATE] No profile or statusChar found. Profile:`, profile);
        return {};
    }

    try {
        console.log(`[STATE] Reading characteristic ${profile.statusChar}...`);
        const hex = await readCharacteristic(deviceId, profile.statusChar);
        console.log(`[STATE] Raw hex response: ${hex} (length: ${hex?.length || 0})`);

        if (!hex) {
            console.log(`[STATE] No hex data received from characteristic ${profile.statusChar}`);
            return {};
        }

        if (profile.encoding === '55aa') {
            const parsed = parseILinkStatus(hex);
            console.log(`[STATE] Parsed state (55aa):`, parsed);
            if (Object.keys(parsed).length > 0) {
                updateDeviceLastState(deviceId, parsed);
            }
            return parsed;
        }

        console.log(`[STATE] No parser for encoding ${profile.encoding}`);
        return {};
    } catch (e) {
        console.error(`[STATE] Failed to read state for ${deviceId}:`, e);
        if (e instanceof Error) {
            console.error(`[STATE] Error details:`, e.message, e.stack);
        }
        return {};
    }
}

/**
 * Send a control command to a light device
 */
export async function sendLightCommand(
    deviceId: string,
    command: ControlCommand
): Promise<boolean> {
    const device = state.devices.get(deviceId);
    if (!device) {
        console.error(`[BLE] sendLightCommand: Device ${deviceId} not found`);
        return false;
    }

    const settings = getDeviceSettings(deviceId);

    let isILink = device.services.includes('a032') || device.services.some(s => s.toLowerCase().includes('a032'));
    if (!isILink && device.characteristics) {
        isILink = device.characteristics.some((c: BLECharacteristic) =>
            c.serviceUuid && (c.serviceUuid.toLowerCase().includes('a032') || c.serviceUuid.toLowerCase().replace(/-/g, '') === 'a032')
        );
    }

    const profileId = settings.profileId || (isILink ? 'ilink' : 'generic');
    const profile = PROFILES.find(p => p.id === profileId) || PROFILES[PROFILES.length - 1];

    let hexCommand = '';
    let targetChar = settings.targetChar || profile.targetChar;

    switch (profile.encoding) {
        case '55aa':
            switch (command.type) {
                case 'power':
                    hexCommand = encodeILinkCommand('0805', command.value ? '01' : '00');
                    break;
                case 'brightness':
                    const val = Math.min(255, Math.floor((command.value as number) * 2.55));
                    hexCommand = encodeILinkCommand('0801', val.toString(16).padStart(2, '0'));
                    break;
                case 'color':
                    const { r: red, g: green, b: blue } = command.value as { r: number; g: number; b: number };
                    const colorHex = red.toString(16).padStart(2, '0') + green.toString(16).padStart(2, '0') + blue.toString(16).padStart(2, '0');
                    hexCommand = encodeILinkCommand('0802', colorHex);
                    break;
            }
            break;

        case 'triones':
            hexCommand = encodeTrionesCommand(command);
            break;

        case 'magic':
            hexCommand = encodeMagicHomeCommand(command);
            break;

        case 'raw':
        default:
            switch (command.type) {
                case 'power':
                    hexCommand = command.value ? '01' : '00';
                    break;
                case 'brightness':
                    const b = Math.min(100, Math.max(0, command.value as number));
                    hexCommand = `02${b.toString(16).padStart(2, '0')}`;
                    break;
            }
            break;
    }

    if (!hexCommand) {
        console.error(`[BLE] sendLightCommand: No hex command generated for type=${command.type}, profile=${profile.id}`);
        return false;
    }

    if (!targetChar) {
        const writableChar = device.characteristics.find((c: BLECharacteristic) =>
            c.properties.includes('write') || c.properties.includes('writeWithoutResponse')
        );
        targetChar = writableChar?.uuid || 'ffe1';
    }

    const success = await writeCharacteristic(deviceId, targetChar, hexCommand);
    if (success) {
        const stateUpdate: Partial<LightState> = {};
        if (command.type === 'power') stateUpdate.power = command.value as boolean;
        else if (command.type === 'brightness') stateUpdate.brightness = command.value as number;
        else if (command.type === 'color') stateUpdate.color = command.value as { r: number; g: number; b: number };
        else if (command.type === 'colorTemperature') stateUpdate.colorTemperature = command.value as number;

        if (Object.keys(stateUpdate).length > 0) {
            updateDeviceLastState(deviceId, stateUpdate);
        }
    }
    return success;
}

/**
 * Write to a characteristic (for light control)
 */
export async function writeCharacteristic(
    deviceId: string,
    characteristicUuid: string,
    value: string // hex string
): Promise<boolean> {
    const device = state.devices.get(deviceId);
    if (!device) {
        throw new Error(`Device not found: ${deviceId}`);
    }

    if (!device.connected) {
        throw new Error('Device not connected');
    }

    const logEntry: CommandLogEntry = {
        id: generateId(),
        deviceId,
        timestamp: Date.now(),
        characteristic: characteristicUuid,
        command: value,
        success: false,
    };

    if (state.isMockMode) {
        await new Promise(resolve => setTimeout(resolve, 100));
        logEntry.success = true;
        logEntry.response = 'OK (mock)';
        state.commandLog.push(logEntry);

        emitEvent('device_updated', { deviceId, command: value });
        return true;
    }

    // Real BLE write
    const deviceChars = state.characteristics.get(deviceId);
    if (!deviceChars) {
        logEntry.response = 'No characteristics found';
        state.commandLog.push(logEntry);
        return false;
    }

    const normalizedUuid = characteristicUuid.toLowerCase().replace('0x', '').replace(/-/g, '');
    const char = deviceChars.get(normalizedUuid) || deviceChars.get(characteristicUuid.toLowerCase()) || deviceChars.get(characteristicUuid);

    if (!char) {
        logEntry.response = `Characteristic ${characteristicUuid} not found`;
        state.commandLog.push(logEntry);
        console.error(`[BLE] Characteristic not found: ${characteristicUuid}`);
        return false;
    }

    try {
        const buffer = Buffer.from(value.replace(/\s/g, ''), 'hex');
        const withoutResponse = char.properties?.includes('writeWithoutResponse') || false;

        await char.writeAsync(buffer, withoutResponse);

        logEntry.success = true;
        logEntry.response = 'OK';
        state.commandLog.push(logEntry);

        emitEvent('device_updated', { deviceId, command: value });
        return true;
    } catch (error) {
        logEntry.response = error instanceof Error ? error.message : 'Write failed';
        state.commandLog.push(logEntry);
        console.error('[BLE] Write failed:', error);
        return false;
    }
}

/**
 * Read from a characteristic
 */
export async function readCharacteristic(
    deviceId: string,
    characteristicUuid: string
): Promise<string | null> {
    const device = state.devices.get(deviceId);
    if (!device) {
        throw new Error(`Device not found: ${deviceId}`);
    }

    if (!device.connected) {
        throw new Error('Device not connected');
    }

    if (state.isMockMode) {
        console.log(`[READ] Mock mode: returning mock value for ${characteristicUuid}`);
        return '0100640032';
    }

    const deviceChars = state.characteristics.get(deviceId);
    if (!deviceChars) {
        console.log(`[READ] No characteristics map found for device ${deviceId}`);
        return null;
    }

    const normalizedUuid = characteristicUuid.toLowerCase().replace('0x', '');
    const char = deviceChars.get(normalizedUuid) || deviceChars.get(characteristicUuid);

    console.log(`[READ] Attempting to read characteristic ${characteristicUuid} (normalized: ${normalizedUuid})`);

    if (!char) {
        console.log(`[READ] Characteristic not found. Available:`, Array.from(deviceChars.keys()));
        return null;
    }

    console.log(`[READ] Found characteristic, properties:`, char.properties);

    if (!char.properties.includes('read') && !char.properties.includes('notify')) {
        console.log(`[READ] Warning: Characteristic does not have read or notify property`);
    }

    try {
        console.log(`[READ] Calling readAsync()...`);
        const data = await char.readAsync();
        const hex = data.toString('hex');
        console.log(`[READ] Success: Received ${data.length} bytes, hex=${hex}`);
        return hex;
    } catch (error) {
        console.error(`[READ] Read failed for ${characteristicUuid}:`, error);
        if (error instanceof Error) {
            console.error(`[READ] Error details:`, error.message, error.stack);
        }
        return null;
    }
}

/**
 * Subscribe to characteristic notifications
 */
export async function subscribeToNotifications(
    deviceId: string,
    characteristicUuid: string
): Promise<boolean> {
    const device = state.devices.get(deviceId);
    if (!device) throw new Error(`Device not found: ${deviceId}`);
    if (!device.connected) throw new Error('Device not connected');

    if (state.isMockMode) return true;

    const deviceChars = state.characteristics.get(deviceId);
    if (!deviceChars) return false;

    const normalizedUuid = characteristicUuid.toLowerCase().replace('0x', '');
    const char = deviceChars.get(normalizedUuid) || deviceChars.get(characteristicUuid);

    if (!char) {
        console.error(`[BLE] Characteristic not found for subscribe: ${characteristicUuid}`);
        return false;
    }

    if (!char.properties.includes('notify') && !char.properties.includes('indicate')) {
        console.error(`[BLE] Characteristic does not support notifications: ${characteristicUuid}`);
        return false;
    }

    try {
        char.on('data', (data: Buffer) => {
            const hex = data.toString('hex');
            emitEvent('device_updated', {
                deviceId,
                characteristic: characteristicUuid,
                notification: hex,
                timestamp: Date.now()
            });

            const lastLog = state.commandLog.findLast(l => l.deviceId === deviceId && l.characteristic === 'a044' || l.characteristic === 'a040');
            if (lastLog) {
                lastLog.response = hex;
            }
        });

        await char.subscribeAsync();
        return true;
    } catch (error) {
        console.error(`[BLE] Subscribe failed for ${characteristicUuid}:`, error);
        return false;
    }
}
