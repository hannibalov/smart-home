import { NextRequest, NextResponse } from 'next/server';
import { writeCharacteristic, readCharacteristic } from '@/services/ble';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: deviceId } = await params;
    const body = await request.json();
    const { patterns, delay = 1000, readAfter = 'a041' } = body;

    if (!patterns || !Array.isArray(patterns)) {
        return NextResponse.json({ error: 'Patterns array is required' }, { status: 400 });
    }

    const results = [];

    for (const pattern of patterns) {
        try {
            // 1. Write
            const success = await writeCharacteristic(deviceId, pattern.characteristic, pattern.hex);

            // 2. Delay
            if (delay > 0) {
                await new Promise(r => setTimeout(r, delay));
            }

            // 3. Read back (optional)
            let readValue = null;
            if (readAfter) {
                readValue = await readCharacteristic(deviceId, readAfter);
            }

            results.push({
                name: pattern.name,
                hex: pattern.hex,
                success,
                readValue,
                timestamp: Date.now()
            });

        } catch (error) {
            results.push({
                name: pattern.name,
                error: error instanceof Error ? error.message : 'Step failed',
                timestamp: Date.now()
            });
        }
    }

    return NextResponse.json({ results });
}
