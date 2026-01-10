import { NextRequest, NextResponse } from 'next/server';
import { toggleSaveDevice } from '@/services/ble';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const isSaved = toggleSaveDevice(id);

        return NextResponse.json({ success: true, saved: isSaved });
    } catch (error) {
        console.error(`[API] Failed to toggle save for device:`, error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to toggle save' },
            { status: 500 }
        );
    }
}
