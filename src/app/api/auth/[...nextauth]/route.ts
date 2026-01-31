/**
 * DEPRECATED: NextAuth route has been replaced with Supabase Auth
 * 
 * Authentication is now handled by Supabase Auth directly.
 * This route is kept for backwards compatibility but no longer used.
 * 
 * See:
 * - /src/lib/supabase-client.ts for client-side auth
 * - /src/lib/supabase-server.ts for server-side auth
 */

export function GET() {
	return new Response('This endpoint is deprecated. Use Supabase Auth instead.', {
		status: 404,
	})
}

export function POST() {
	return new Response('This endpoint is deprecated. Use Supabase Auth instead.', {
		status: 404,
	})
}
