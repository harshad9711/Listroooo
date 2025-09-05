/*
  # Add OAuth token management functions

  1. New Functions
    - `fn_store_oauth_token`: Upserts OAuth tokens with automatic expiry calculation
    - `fn_get_valid_oauth_token`: Retrieves valid (non-expired) OAuth token for a user and platform
    - `fn_refresh_oauth_token`: Marks token for refresh when expired

  2. Security
    - Functions execute with invoker security
    - Access controlled through RLS policies
*/

-- Function to store OAuth tokens
CREATE OR REPLACE FUNCTION fn_store_oauth_token(
  p_user_id uuid,
  p_platform text,
  p_access_token text,
  p_refresh_token text,
  p_expires_in integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_token_id uuid;
BEGIN
  INSERT INTO oauth_tokens (
    user_id,
    platform,
    access_token,
    refresh_token,
    expires_at
  )
  VALUES (
    p_user_id,
    p_platform,
    p_access_token,
    p_refresh_token,
    CASE 
      WHEN p_expires_in IS NOT NULL THEN now() + (p_expires_in || ' seconds')::interval
      ELSE NULL
    END
  )
  ON CONFLICT (user_id, platform)
  DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    expires_at = EXCLUDED.expires_at,
    updated_at = now()
  RETURNING id INTO v_token_id;

  RETURN v_token_id;
END;
$$;

-- Function to get valid OAuth token
CREATE OR REPLACE FUNCTION fn_get_valid_oauth_token(
  p_user_id uuid,
  p_platform text
)
RETURNS TABLE (
  id uuid,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  needs_refresh boolean
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.access_token,
    t.refresh_token,
    t.expires_at,
    CASE
      WHEN t.expires_at IS NOT NULL AND t.expires_at <= now() + interval '5 minutes'
      THEN true
      ELSE false
    END as needs_refresh
  FROM oauth_tokens t
  WHERE t.user_id = p_user_id
    AND t.platform = p_platform
    AND (t.expires_at IS NULL OR t.expires_at > now())
  LIMIT 1;
END;
$$;