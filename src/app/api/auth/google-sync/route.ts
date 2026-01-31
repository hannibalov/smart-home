import { NextResponse } from 'next/server'

/**
 * DEPRECATED: This endpoint is no longer needed.
 * Supabase Auth now handles all OAuth provider integration and user creation.
 * The user profile is automatically created when they authenticate with Supabase Auth.
 */
export async function POST() {
    return NextResponse.json(
        { error: 'This endpoint has been deprecated. Supabase Auth handles OAuth integration.' },
        { status: 410 }
    )
}
