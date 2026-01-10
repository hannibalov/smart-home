import { NextRequest, NextResponse } from 'next/server';
import { subscribeToNotifications } from '@/services/ble';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: deviceId } = await params;
    const body = await request.json();
    const { uuid: charUuid } = body;

    if (!charUuid) {
        return NextResponse.json({ error: 'Characteristic UUID is required' }, { status: 400 });
    }

    try {
        const success = await subscribeToNotifications(deviceId, charUuid);
        return NextResponse.json({ success });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Subscribe failed' },
            { status: 500 }
        );
    }
}
