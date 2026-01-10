
import type { BLEDevice, BLECharacteristic } from '@/types';

/**
 * Create mock devices for development/testing
 */
export function createMockDevices(): BLEDevice[] {
    return [
        {
            id: 'mock-bulb-1',
            name: 'Smart RGB Bulb',
            rssi: -65,
            connected: false,
            services: ['ffe1', 'a032'],
            lastSeen: Date.now(),
            saved: false,
        },
        {
            id: 'mock-strip-1',
            name: 'LED Strip Controller',
            rssi: -72,
            connected: false,
            services: ['7e00'],
            lastSeen: Date.now(),
            saved: true,
        },
        {
            id: 'mock-desk-1',
            name: 'Desk Lamp',
            rssi: -58,
            connected: false,
            services: ['cc00'],
            lastSeen: Date.now(),
            saved: false,
        }
    ];
}

/**
 * Create mock characteristics for a device
 */
export function createMockCharacteristics(): BLECharacteristic[] {
    return [
        {
            uuid: 'ffe1',
            serviceUuid: 'ffe0',
            properties: ['write', 'writeWithoutResponse', 'notify'],
            value: undefined,
        },
        {
            uuid: 'ffe2',
            serviceUuid: 'ffe0',
            properties: ['read', 'notify'],
            value: '0100640032',
        },
    ];
}
