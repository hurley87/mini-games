-- Create build_versions table
CREATE TABLE build_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  build_id UUID NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  html TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by_fid BIGINT NOT NULL,
  description TEXT DEFAULT '',
  
  -- Ensure unique version numbers per build
  UNIQUE(build_id, version_number)
);

-- Create index for faster queries
CREATE INDEX idx_build_versions_build_id ON build_versions(build_id);
CREATE INDEX idx_build_versions_created_at ON build_versions(created_at DESC);

-- Create function to get next version number
CREATE OR REPLACE FUNCTION get_next_version_number(p_build_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO next_version 
  FROM build_versions 
  WHERE build_id = p_build_id;
  
  RETURN next_version;
END;
$$ LANGUAGE plpgsql;