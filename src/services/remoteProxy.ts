
/**
 * Remote Proxy Utility
 * 
 * This utility allows the Next.js app running on Vercel to forward device-control
 * API requests to a Raspberry Pi running the same app locally.
 */

/**
 * Checks if the application should proxy requests to a remote controller.
 * True if REMOTE_CONTROL_URL is set and we're not running on the local controller.
 */
export function shouldProxy(): boolean {
    const remoteUrl = process.env.REMOTE_CONTROL_URL;
    return !!remoteUrl && remoteUrl !== '';
}

/**
 * Proxies the current request to the remote controller.
 * @param request The original Request object
 * @returns A Promise that resolves to the Response from the remote controller
 */
export async function proxyToRemote(request: Request): Promise<Response> {
    const remoteControlUrl = process.env.REMOTE_CONTROL_URL;
    if (!remoteControlUrl) {
        throw new Error('REMOTE_CONTROL_URL is not defined');
    }

    const url = new URL(request.url);
    const remoteUrl = new URL(url.pathname + url.search, remoteControlUrl);

    console.log(`[Proxy] Forwarding ${request.method} ${url.pathname} to ${remoteUrl.toString()}`);

    try {
        const headers = new Headers(request.headers);
        // We might want to remove some headers that could interfere with the proxy
        headers.delete('host');
        headers.delete('connection');

        const options: RequestInit = {
            method: request.method,
            headers,
            // Skip body for GET/DELETE without body
            body: ['GET', 'HEAD'].includes(request.method) ? null : await request.clone().arrayBuffer(),
            // @ts-expect-error - duplex is required for streaming bodies in some environments
            duplex: 'half'
        };

        const response = await fetch(remoteUrl.toString(), options);

        // Create a new response to return, copying headers and status
        const responseHeaders = new Headers(response.headers);
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error('[Proxy] Error forwarding request:', error);
        return new Response(JSON.stringify({
            error: 'Failed to reach remote controller',
            details: error instanceof Error ? error.message : String(error)
        }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
