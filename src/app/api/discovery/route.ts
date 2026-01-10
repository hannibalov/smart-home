import { NextResponse } from 'next/server';
import {
    startScan,
    stopScan,
    getDevices,
    connectDevice,
    getDevice,
    bleEvents
} from '@/services/ble';
import { BLEDevice } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log('[Discovery] Starting discovery for "ilight"...');

    try {
        // 1. Start Scan
        await startScan(5000);

        // 2. Wait for 'ilight' to be found or timeout
        const targetDevice = await new Promise<BLEDevice | undefined>((resolve) => {
            const checkDevices = () => {
                const devices = getDevices();
                return devices.find(d => d.name && d.name.toLowerCase().includes('ilink'));
            };

            // Check if already found
            const existing = checkDevices();
            if (existing) {
                resolve(existing);
                return;
            }

            const onDiscover = (device: BLEDevice) => {
                if (device.name && device.name.toLowerCase().includes('ilink')) {
                    cleanup();
                    resolve(device);
                }
            };

            const cleanup = () => {
                bleEvents.off('device_discovered', onDiscover);
                clearTimeout(timeout);
            };

            bleEvents.on('device_discovered', onDiscover);

            // 5 second timeout for discovery
            const timeout = setTimeout(() => {
                cleanup();
                resolve(undefined);
            }, 5000);
        });

        await stopScan();

        if (!targetDevice) {
            return NextResponse.json({
                error: 'Device "ilight" not found during scan',
                devicesFound: getDevices().map(d => d.name)
            }, { status: 404 });
        }

        console.log(`[Discovery] Found device: ${targetDevice.name} (${targetDevice.id})`);

        // 3. Connect to device
        console.log('[Discovery] Connecting...');
        await connectDevice(targetDevice.id);

        // 4. Get Details
        const details = getDevice(targetDevice.id);

        return NextResponse.json({
            status: 'success',
            device: details
        });

    } catch (error) {
        console.error('[Discovery] Error:', error);
        await stopScan().catch(() => { }); // Ensure scan stops
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
