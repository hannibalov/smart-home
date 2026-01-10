import { NextRequest, NextResponse } from 'next/server';
import { readCharacteristic } from '@/services/ble';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: deviceId } = await params;
    const { searchParams } = new URL(request.url);
    const charUuid = searchParams.get('uuid');

    if (!charUuid) {
        return NextResponse.json({ error: 'Characteristic UUID is required' }, { status: 400 });
    }

    try {
        const value = await readCharacteristic(deviceId, charUuid);
        return NextResponse.json({ success: true, value });
    } catch (error) {
        console.error(`[API] Read failed for ${deviceId}/${charUuid}:`, error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Read failed' },
            { status: 500 }
        );
    }
}
