import { DeviceProfile } from '@/types';

export const PROFILES: DeviceProfile[] = [
    {
        id: 'ilink',
        name: 'iLink (55AA)',
        description: 'iLink app compatible lights. Uses 55AA protocol on characteristic a040.',
        targetChar: 'a040',
        statusChar: 'a042',
        encoding: '55aa',
    },
    {
        id: 'triones',
        name: 'Triones / Happy Lighting',
        description: 'Common protocol for cheap RGB strips and bulbs. Header 0x56, footer 0xAA.',
        targetChar: 'ffe1',
        statusChar: 'ffe1', // Often the same for read/write
        encoding: 'triones',
    },
    {
        id: 'magic-home',
        name: 'Magic Home / Flux LED',
        description: 'WiFi/BLE protocol starting with 0x7E.',
        targetChar: 'ffe1',
        statusChar: 'ffe1',
        encoding: 'magic',
    },
    {
        id: 'generic',
        name: 'Generic / Single Byte',
        description: 'Simplest protocol using single bytes for On (01) and Off (00).',
        targetChar: 'ffe1',
        encoding: 'raw',
    }
];
