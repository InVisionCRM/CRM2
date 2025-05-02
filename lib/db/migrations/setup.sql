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

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON TABLE leads TO postgres;
GRANT ALL PRIVILEGES ON TABLE files TO postgres; 