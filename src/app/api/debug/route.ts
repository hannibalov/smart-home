import { NextResponse } from 'next/server';
import { isInMockMode, getAdapterState, getDevices, getDevice, getCommandLog } from '@/services/ble';

/**
 * GET /api/debug - Get BLE service debug information
 */
export async function GET() {
    try {
        const devices = getDevices();
        const connectedDevices = devices.filter(d => d.connected);

        // Get characteristics for connected devices
        const deviceDetails = await Promise.all(
            connectedDevices.map(async (d) => {
                const details = getDevice(d.id);
                return {
                    id: d.id,
                    name: d.name,
                    connected: d.connected,
                    characteristics: details?.characteristics || [],
                };
            })
        );

        return NextResponse.json({
            mockMode: isInMockMode(),
            adapterState: getAdapterState(),
            totalDevices: devices.length,
            connectedDevices: connectedDevices.length,
            devices: deviceDetails,
            recentCommands: getCommandLog(10),
        });
    } catch (error) {
        console.error('Debug endpoint error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
