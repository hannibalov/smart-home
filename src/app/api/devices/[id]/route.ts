import { NextResponse } from 'next/server';
import { getDevice, connectDevice, disconnectDevice } from '@/services/ble';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/devices/[id] - Get device details
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const device = getDevice(id);

        if (!device) {
            return NextResponse.json(
                { error: 'Device not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(device);
    } catch (error) {
        console.error('Error getting device:', error);
        return NextResponse.json(
            { error: 'Failed to get device' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/devices/[id] - Connect to device
 */
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const action = body.action || 'connect';

        if (action === 'connect') {
            const device = await connectDevice(id);
            return NextResponse.json({
                message: 'Connected',
                device,
            });
        } else if (action === 'disconnect') {
            await disconnectDevice(id);
            return NextResponse.json({
                message: 'Disconnected',
            });
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error with device action:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to perform action' },
            { status: 500 }
        );
    }
}
