-- Create users table for email/password and Google OAuth authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  auth_provider VARCHAR(50) NOT NULL DEFAULT 'email', -- 'email', 'google', or 'both'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  -- Ensure at least one auth method exists
  CONSTRAINT at_least_one_auth_method CHECK (
    (auth_provider = 'email' AND password_hash IS NOT NULL) OR
    (auth_provider = 'google' AND google_id IS NOT NULL) OR
    (auth_provider = 'both' AND password_hash IS NOT NULL AND google_id IS NOT NULL)
  )
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Create policies to allow users to read their own data
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create policy to allow service role to create users (for registration)
CREATE POLICY "Service role can create users" ON users
  FOR INSERT WITH CHECK (true);
