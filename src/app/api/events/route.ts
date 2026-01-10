import { bleEvents } from '@/services/ble';
import type { DeviceEvent } from '@/types';

/**
 * GET /api/events - Server-Sent Events for real-time device updates
 */
export async function GET() {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            // Send initial connection message
            const connectMessage = `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`;
            controller.enqueue(encoder.encode(connectMessage));

            // Handler for device events
            const eventHandler = (event: DeviceEvent) => {
                try {
                    const message = `data: ${JSON.stringify(event)}\n\n`;
                    controller.enqueue(encoder.encode(message));
                } catch {
                    // Controller might be closed
                }
            };

            // Subscribe to events
            bleEvents.on('device-event', eventHandler);

            // Send heartbeat every 30 seconds to keep connection alive
            const heartbeatInterval = setInterval(() => {
                try {
                    const heartbeat = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`;
                    controller.enqueue(encoder.encode(heartbeat));
                } catch {
                    clearInterval(heartbeatInterval);
                }
            }, 30000);

            // Cleanup on close
            const cleanup = () => {
                bleEvents.off('device-event', eventHandler);
                clearInterval(heartbeatInterval);
            };

            // Store cleanup for when stream closes
            (controller as unknown as { cleanup: () => void }).cleanup = cleanup;
        },
        cancel(controller) {
            // Clean up when client disconnects
            const cleanup = (controller as unknown as { cleanup?: () => void }).cleanup;
            if (cleanup) cleanup();
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
