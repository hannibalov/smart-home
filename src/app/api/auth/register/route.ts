import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password, name } = body

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            )
        }

        // Use admin client to create user with email/password
        const supabaseAdmin = createAdminSupabaseClient()

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: false,
        })

        if (authError) {
            console.error('Error creating auth user:', authError)
            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            )
        }

        // Update user profile in the users table
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                name: name || email.split('@')[0],
                updated_at: new Date().toISOString(),
            })
            .eq('id', authData.user.id)

        if (updateError) {
            console.error('Error updating user profile:', updateError)
        }

        return NextResponse.json(
            { user: { id: authData.user.id, email: authData.user.email }, message: 'User created successfully' },
            { status: 201 }
        )
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
