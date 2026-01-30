import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyPassword } from '@/lib/password'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Find user by email
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, password_hash, is_active')
            .eq('email', email)
            .single()

        if (error || !user) {
            // Don't reveal if user exists
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        if (!user.is_active) {
            return NextResponse.json(
                { error: 'Account is inactive' },
                { status: 401 }
            )
        }

        // Verify password
        const isPasswordValid = verifyPassword(password, user.password_hash)

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Return user data without password hash
        const { password_hash, ...userWithoutPassword } = user

        return NextResponse.json(
            { user: userWithoutPassword },
            { status: 200 }
        )
    } catch (error) {
        console.error('Validation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
