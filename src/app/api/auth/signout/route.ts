import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST() {
    const supabase = await createServerSupabaseClient()

    try {
        await supabase.auth.signOut()
    } catch (error) {
        console.error('Error signing out:', error)
        return NextResponse.json(
            { error: 'Failed to sign out' },
            { status: 500 }
        )
    }

    return NextResponse.json({ message: 'Signed out successfully' })
}
