import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
        'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
    )
}

/**
 * Supabase client for browser/client-side operations
 * Use this in client components for auth and queries
 */
export const supabaseClient = createClient(supabaseUrl, supabasePublishableKey)

/**
 * Supabase server client for server-side operations
 * Use this in server components, API routes, and middleware
 */
export async function createServerSupabaseClient() {
    const cookieStore = await cookies()

    return createServerClient(
        supabaseUrl!,
        supabasePublishableKey!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options as Record<string, unknown>)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware handling cookie updates.
                    }
                },
            },
        }
    )
}

/**
 * Get the current session from the server
 */
export async function getServerSession() {
    const supabase = await createServerSupabaseClient()
    const {
        data: { session },
    } = await supabase.auth.getSession()
    return session
}

/**
 * Get the current authenticated user from the server
 */
export async function getServerUser() {
    const session = await getServerSession()
    return session?.user || null
}

/**
 * Admin client for server-side operations requiring service role
 * Use sparingly and only for operations that need elevated privileges
 */
export function createAdminSupabaseClient() {
    if (!supabaseSecretKey) {
        throw new Error('Missing SUPABASE_SECRET_KEY for admin operations')
    }

    return createClient(supabaseUrl!, supabaseSecretKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
