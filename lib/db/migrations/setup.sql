-- Create leads table if it doesn't exist
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  street_address TEXT,
  city TEXT,
  state TEXT,
  zipcode TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  assigned_to TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create files table if it doesn't exist
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lead
    FOREIGN KEY(lead_id)
    REFERENCES leads(id)
    ON DELETE CASCADE
);

-- Create index on lead_id for better query performance
CREATE INDEX IF NOT EXISTS idx_files_lead_id ON files(lead_id);

-- Create index on category for better filtering
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);

-- Create activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT NOT NULL,
  lead_id TEXT,
  status TEXT,
  CONSTRAINT fk_lead_activity
    FOREIGN KEY(lead_id)
    REFERENCES leads(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_activity
    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON TABLE leads TO postgres;
GRANT ALL PRIVILEGES ON TABLE files TO postgres;
GRANT ALL PRIVILEGES ON TABLE activities TO postgres; 