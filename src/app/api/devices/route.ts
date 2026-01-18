import { NextResponse } from 'next/server';
import { startScan, stopScan, getDevices, getScanStatus, initialize } from '@/services/ble';
import { getWiFiDevices } from '@/services/ac';
import { shouldProxy, proxyToRemote } from '@/services/remoteProxy';

/**
 * GET /api/devices - List all discovered devices
 */
export async function GET(request: Request) {
    if (shouldProxy()) return proxyToRemote(request);

    // Initialize BLE service to ensure settings are loaded and auto-reconnect starts
    await initialize();

    try {
        const bleDevices = getDevices();
        const wifiDevices = await getWiFiDevices();
        const scanning = getScanStatus();

        return NextResponse.json({
            devices: [...bleDevices, ...wifiDevices],
            scanning,
            count: bleDevices.length + wifiDevices.length,
            bleCount: bleDevices.length,
            wifiCount: wifiDevices.length,
        });
    } catch (error) {
        console.error('Error getting devices:', error);
        return NextResponse.json(
            { error: 'Failed to get devices' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/devices - Start device scan
 */
export async function POST(request: Request) {
    if (shouldProxy()) return proxyToRemote(request);
    try {
        const body = await request.json().catch(() => ({}));
        const duration = body.duration || 5000;

        // Initialize BLE service if not already
        await initialize();

        // Start scan in background
        startScan(duration).catch(console.error);

        return NextResponse.json({
            message: 'Scan started',
            duration,
        });
    } catch (error) {
        console.error('Error starting scan:', error);
        return NextResponse.json(
            { error: 'Failed to start scan' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/devices - Stop ongoing scan
 */
export async function DELETE(request: Request) {
    if (shouldProxy()) return proxyToRemote(request);
    try {
        await stopScan();
        return NextResponse.json({ message: 'Scan stopped' });
    } catch (error) {
        console.error('Error stopping scan:', error);
        return NextResponse.json(
            { error: 'Failed to stop scan' },
            { status: 500 }
        );
    }
}
