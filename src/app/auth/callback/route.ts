import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
        try {
            const supabase = await createServerSupabaseClient()
            await supabase.auth.exchangeCodeForSession(code)
        } catch (error) {
            console.error('Error exchanging code for session:', error)
            return NextResponse.redirect(new URL('/login?error=AuthError', request.url))
        }
    }

    // Redirect to home after successful auth
    return NextResponse.redirect(new URL('/', request.url))
}
