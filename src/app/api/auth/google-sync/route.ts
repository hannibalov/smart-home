import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface GoogleProfile {
    google_id: string
    email: string
    name?: string
}

/**
 * This endpoint is called after Google OAuth verification to sync the user to the database.
 * It creates or updates the user in the database if they don't exist.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { google_id, email, name } = body as GoogleProfile

        // Validate input
        if (!google_id || !email) {
            return NextResponse.json(
                { error: 'Google ID and email are required' },
                { status: 400 }
            )
        }

        // Try to find existing user by email or google_id
        const { data: existingUser, error: selectError } = await supabase
            .from('users')
            .select('id, email, auth_provider, google_id')
            .or(`email.eq.${email},google_id.eq.${google_id}`)
            .maybeSingle()

        if (selectError && selectError.code !== 'PGRST116') {
            // PGRST116 is "no rows found" which is expected
            console.error('Error fetching user:', selectError)
            throw selectError
        }

        if (existingUser) {
            // User exists, check if we need to update auth_provider
            let updateData: any = {}

            // If user already has Google ID, just return user
            if (existingUser.google_id === google_id) {
                return NextResponse.json({ user: existingUser }, { status: 200 })
            }

            // Update to 'both' if user is adding Google to email/password
            if (!existingUser.google_id && existingUser.auth_provider === 'email') {
                updateData = {
                    google_id,
                    auth_provider: 'both',
                    updated_at: new Date().toISOString(),
                }
            }

            if (Object.keys(updateData).length > 0) {
                const { error: updateError } = await supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', existingUser.id)

                if (updateError) {
                    console.error('Error updating user:', updateError)
                    throw updateError
                }
            }

            return NextResponse.json(
                { user: { ...existingUser, ...updateData } },
                { status: 200 }
            )
        }

        // Create new user with Google OAuth
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
                {
                    email,
                    google_id,
                    name: name || email.split('@')[0],
                    auth_provider: 'google',
                    password_hash: null,
                },
            ])
            .select('id, email, name, google_id, auth_provider')
            .single()

        if (insertError) {
            console.error('Error creating user:', insertError)
            return NextResponse.json(
                { error: 'Failed to create user' },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { user: newUser, message: 'User created via Google OAuth' },
            { status: 201 }
        )
    } catch (error) {
        console.error('Google OAuth sync error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
