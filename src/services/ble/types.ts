
import { EventEmitter } from 'events';
import type { DeviceDetails, CommandLogEntry } from '@/types';

// Noble types (dynamic import)
export type Noble = typeof import('@abandonware/noble');
export type Peripheral = import('@abandonware/noble').Peripheral;
export type Characteristic = import('@abandonware/noble').Characteristic;

// Global state container for Next.js HMR stability
export interface BLEState {
    noble: Noble | null;
    isMockMode: boolean;
    nobleState: string;
    devices: Map<string, DeviceDetails>;
    peripherals: Map<string, Peripheral>;
    characteristics: Map<string, Map<string, Characteristic>>;
    commandLog: CommandLogEntry[];
    isScanning: boolean;
    scanTimeout: NodeJS.Timeout | null;
    bleEvents: EventEmitter;
}
