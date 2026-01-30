-- Create homes table
CREATE TABLE IF NOT EXISTS homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_homes junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS user_homes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, home_id)
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE NOT NULL,
  hardware_id VARCHAR(255), -- The physical ID (e.g. MAC address or IP)
  custom_name VARCHAR(255),
  type VARCHAR(50), -- 'light', 'ac', etc.
  connectivity VARCHAR(50), -- 'bluetooth', 'wifi', etc.
  protocol VARCHAR(50), -- 'ilink', 'tuya', etc.
  last_ip VARCHAR(50),
  last_seen TIMESTAMP WITH TIME ZONE,
  is_connected BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}', -- Store profileId, targetChar, etc.
  last_state JSONB DEFAULT '{}', -- Store power, color, temp, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Ensure unique hardware_id per home (optional, but good practice usually)
  UNIQUE(home_id, hardware_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_homes_user_id ON user_homes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_homes_home_id ON user_homes(home_id);
CREATE INDEX IF NOT EXISTS idx_devices_home_id ON devices(home_id);
CREATE INDEX IF NOT EXISTS idx_devices_hardware_id ON devices(hardware_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
-- This was missing for 'users' in the previous migration, so we add it here just in case.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Homes: Users can view homes they are members of
CREATE POLICY "Users can view homes they belong to" ON homes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_homes
      WHERE user_homes.home_id = homes.id
      AND user_homes.user_id = auth.uid()
    )
  );

-- Homes: Only admins can update homes
CREATE POLICY "Admins can update homes" ON homes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_homes
      WHERE user_homes.home_id = homes.id
      AND user_homes.user_id = auth.uid()
      AND user_homes.role = 'admin'
    )
  );

-- Homes: Only admins can delete homes
CREATE POLICY "Admins can delete homes" ON homes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_homes
      WHERE user_homes.home_id = homes.id
      AND user_homes.user_id = auth.uid()
      AND user_homes.role = 'admin'
    )
  );
  
-- Homes: Anyone can create a home (and typically they should become admin, handled by app logic or trigger)
CREATE POLICY "Users can create homes" ON homes
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- User_Homes: Users can view who is in their homes
CREATE POLICY "Users can view members of their homes" ON user_homes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_homes uh
      WHERE uh.home_id = user_homes.home_id
      AND uh.user_id = auth.uid()
    )
  );

-- User_Homes: Admins can manage members (add/remove)
CREATE POLICY "Admins can manage home members" ON user_homes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_homes uh
      WHERE uh.home_id = user_homes.home_id
      AND uh.user_id = auth.uid()
      AND uh.role = 'admin'
    )
  );


-- Devices: Users can view devices in their homes
CREATE POLICY "Users can view devices in their homes" ON devices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_homes
      WHERE user_homes.home_id = devices.home_id
      AND user_homes.user_id = auth.uid()
    )
  );

-- Devices: Users can update devices (control them) in their homes
-- (Assuming any member can control devices. If restricted to admins, check role='admin')
CREATE POLICY "Users can control devices in their homes" ON devices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_homes
      WHERE user_homes.home_id = devices.home_id
      AND user_homes.user_id = auth.uid()
    )
  );

-- Devices: Admins can add/delete devices
CREATE POLICY "Admins can manage devices" ON devices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_homes
      WHERE user_homes.home_id = devices.home_id
      AND user_homes.user_id = auth.uid()
      AND user_homes.role = 'admin'
    )
  );
