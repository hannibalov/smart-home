/**
 * DEPRECATED: NextAuth configuration has been replaced with Supabase Auth.
 * 
 * Previously, this file contained NextAuth configuration with Google OAuth
 * and Credentials provider. All authentication is now handled by Supabase Auth.
 * 
 * Key changes:
 * - Use supabaseClient from '@/lib/supabase-auth' for client-side auth
 * - Use createServerSupabaseClient() for server-side auth
 * - Middleware now uses Supabase session instead of JWT tokens
 * - OAuth flow is handled by Supabase Auth
 * 
 * See src/lib/supabase-auth.ts for the new authentication utilities.
 */

