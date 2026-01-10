import { NextRequest, NextResponse } from 'next/server';
import { getLightState } from '@/services/ble';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: deviceId } = await params;
    const state = await getLightState(deviceId);
    return NextResponse.json(state);
}
