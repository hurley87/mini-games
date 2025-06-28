-- Fix race condition in version creation by making it atomic
CREATE OR REPLACE FUNCTION create_build_version_atomic(
  p_build_id UUID,
  p_title TEXT,
  p_html TEXT,
  p_created_by_fid BIGINT,
  p_description TEXT DEFAULT ''
)
RETURNS build_versions AS $$
DECLARE
  next_version INTEGER;
  new_version build_versions;
BEGIN
  -- Lock the build record to prevent concurrent version creation
  PERFORM 1 FROM builds WHERE id = p_build_id FOR UPDATE;
  
  -- Get the next version number atomically
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO next_version 
  FROM build_versions 
  WHERE build_id = p_build_id;
  
  -- Insert the new version
  INSERT INTO build_versions (
    build_id,
    version_number,
    title,
    html,
    created_by_fid,
    description
  ) VALUES (
    p_build_id,
    next_version,
    p_title,
    p_html,
    p_created_by_fid,
    p_description
  ) RETURNING * INTO new_version;
  
  RETURN new_version;
END;
$$ LANGUAGE plpgsql; 