import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

// Note: This client should ONLY be used in server-side contexts (API routes, services running on the Pi)
// as it bypasses Row Level Security.
export function getServiceSupabase() {
    if (!supabaseUrl || !supabaseSecretKey) {
        // Return null or throw depending on preference. For now returning null to allow graceful fallbacks if envs missing.
        console.warn('Missing SUPABASE_SECRET_KEY, DB operations requiring admin privileges may fail.')
        return null
    }

    return createClient(supabaseUrl, supabaseSecretKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
