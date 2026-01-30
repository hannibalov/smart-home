import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/password'

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

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 409 }
            )
        }

        // Hash password
        const passwordHash = hashPassword(password)

        // Insert new user
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
                {
                    email,
                    password_hash: passwordHash,
                    name: name || email.split('@')[0],
                },
            ])
            .select('id, email, name')
            .single()

        if (insertError) {
            console.error('Error creating user:', insertError)
            return NextResponse.json(
                { error: 'Failed to create user' },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { user: newUser, message: 'User created successfully' },
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
