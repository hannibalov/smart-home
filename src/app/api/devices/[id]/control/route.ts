import { NextResponse } from 'next/server';
import { sendLightCommand, writeCharacteristic, getCommandLog, clearCommandLog } from '@/services/ble';
import { getWiFiDevices } from '@/services/ac';
import { updateDeviceState } from '@/services/hub';
import { shouldProxy, proxyToRemote } from '@/services/remoteProxy';
import type { ControlCommand, ACControlCommand } from '@/types';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/devices/[id]/control - Get command log for device
 */
export async function GET(
    request: Request,
    { params }: RouteParams
) {
    if (shouldProxy()) return proxyToRemote(request);
    try {
        const { id } = await params;
        const log = getCommandLog(100).filter(entry => entry.deviceId === id || !entry.deviceId);
        return NextResponse.json({ log });
    } catch (error) {
        console.error('Error getting command log:', error);
        return NextResponse.json(
            { error: 'Failed to get command log' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/devices/[id]/control - Send control command
 */
export async function POST(request: Request, { params }: RouteParams) {
    if (shouldProxy()) return proxyToRemote(request);
    try {
        const { id } = await params;
        const body = await request.json();

        if (body.raw && body.characteristic) {
            const success = await writeCharacteristic(id, body.characteristic, body.raw);
            return NextResponse.json({ success, raw: true });
        }

        const newState = { [body.type]: body.value };
        await updateDeviceState(id, newState, 'ui');

        return NextResponse.json({ success: true, deviceId: id, newState });
    } catch (error) {
        console.error('[API] Error sending command:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send command' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    if (shouldProxy()) return proxyToRemote(request);
    try {
        clearCommandLog(); // We could also filter to clear only for this device if we update ble.ts
        return NextResponse.json({ message: 'Command log cleared' });
    } catch (error) {
        console.error('Error clearing command log:', error);
        return NextResponse.json(
            { error: 'Failed to clear command log' },
            { status: 500 }
        );
    }
}
