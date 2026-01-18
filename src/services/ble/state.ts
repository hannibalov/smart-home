
import { EventEmitter } from 'events';
import type { BLEState } from './types';
import type { DeviceEvent } from '@/types';

const globalForBLE = global as unknown as { bleState: BLEState };

if (!globalForBLE.bleState) {
    globalForBLE.bleState = {
        noble: null,
        isMockMode: false,
        nobleState: 'unknown',
        devices: new Map(),
        peripherals: new Map(),
        characteristics: new Map(),
        commandLog: [],
        isScanning: false,
        scanType: null,
        scanTimeout: null,
        bleEvents: new EventEmitter(),
    };
}

export const state = globalForBLE.bleState;
export const bleEvents = state.bleEvents;

/**
 * Emit a device event for SSE consumers
 */
export function emitEvent(type: DeviceEvent['type'], payload: unknown): void {
    const event: DeviceEvent = {
        type,
        payload,
        timestamp: Date.now(),
    };
    bleEvents.emit('device-event', event);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}

/**
 * Check if we're running in mock mode
 */
export function isInMockMode(): boolean {
    return state.isMockMode;
}

/**
 * Get the current Bluetooth adapter state
 */
export function getAdapterState(): string {
    return state.nobleState;
}

/**
 * Get scanning status
 */
export function getScanStatus(): boolean {
    return state.isScanning;
}
