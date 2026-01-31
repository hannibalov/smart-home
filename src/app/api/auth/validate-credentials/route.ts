import { NextResponse } from 'next/server'

/**
 * DEPRECATED: This endpoint is no longer needed.
 * Supabase Auth now handles all credential validation.
 * Use Supabase's signInWithPassword() method instead.
 */
export async function POST() {
    return NextResponse.json(
        { error: 'This endpoint has been deprecated. Use Supabase Auth instead.' },
        { status: 410 }
    )
}
