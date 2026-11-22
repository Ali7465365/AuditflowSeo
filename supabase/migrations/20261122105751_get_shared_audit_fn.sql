/*
# Public share lookup function

1. Purpose
- `get_shared_audit(p_token text)` lets anyone open a shared audit link
  (/share/:token) WITHOUT exposing the rest of the audits table.
- Returns the report columns plus the owner's plan (so the share page can
  decide whether to show the "Generated with AuditFlow SEO" badge).

2. Security
- SECURITY DEFINER so anonymous visitors can call it without a broad
  anon SELECT grant on audits.
- Only returns a row when the audit exists AND is_share_enabled = true.
- REVOKE from PUBLIC/anon/authenticated, then GRANT EXECUTE to anon and
  authenticated (share links must work for logged-out visitors).
*/

CREATE OR REPLACE FUNCTION get_shared_audit(p_token text)
RETURNS TABLE (
  id uuid,
  target_url text,
  target_kind text,
  business_name text,
  pagespeed_score integer,
  mobile_load_time_s numeric,
  review_rating numeric,
  review_count integer,
  competitor_rating numeric,
  competitor_review_count integer,
  seo_checks jsonb,
  created_at timestamptz,
  owner_plan text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.target_url,
    a.target_kind,
    a.business_name,
    a.pagespeed_score,
    a.mobile_load_time_s,
    a.review_rating,
    a.review_count,
    a.competitor_rating,
    a.competitor_review_count,
    a.seo_checks,
    a.created_at,
    p.plan AS owner_plan
  FROM audits a
  LEFT JOIN profiles p ON p.user_id = a.user_id
  WHERE a.share_token = p_token
    AND a.is_share_enabled = true
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_shared_audit(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_shared_audit(text) TO anon, authenticated;
