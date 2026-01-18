import { NextRequest, NextResponse } from 'next/server';
import { getLightState } from '@/services/ble';
import { getACState, getWiFiDevices } from '@/services/ac';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: deviceId } = await params;

    const wifiDevices = await getWiFiDevices();
    const isWifi = wifiDevices.some(d => d.id === deviceId);

    if (isWifi) {
        const state = await getACState(deviceId);
        return NextResponse.json(state);
    }

    const state = await getLightState(deviceId);
    return NextResponse.json(state);
}
