import { NextRequest, NextResponse } from 'next/server';
import { getDeviceSettings, setDeviceSettings } from '@/services/ble';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: deviceId } = await params;
    const settings = getDeviceSettings(deviceId);
    return NextResponse.json(settings);
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: deviceId } = await params;
    const body = await request.json();

    setDeviceSettings(deviceId, body);

    return NextResponse.json({ success: true });
}
