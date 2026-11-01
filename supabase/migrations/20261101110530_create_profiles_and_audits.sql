/*
# Create profiles and audits for AuditFlow SEO

1. New Tables
- `profiles`: one row per user. Holds the subscription plan (free, pro, ultra, exclusive), the number of audits used in the current billing period, the start of that period, and an optional agency logo used on white-label reports.
- `audits`: saved SEO audit reports, each linked to the user who created it.

2. Automation
- A trigger creates a `profiles` row whenever a new account is created.
- `record_audit` checks the plan's monthly limit, rolls the monthly counter over when a period has ended, and saves the audit in one step.
- `set_plan` changes the signed-in user's plan.

3. Security
- Row level security is enabled on both tables.
- Users can read only their own profile and audits.
- Users can update only their agency logo on their profile. Plan and usage counters can only change through the functions above.
- Both functions run only for signed-in users.

4. Important Notes
- Plan changes are a mock for this version. No payment is taken.
- Audits are created through `record_audit` only, so the monthly limit cannot be bypassed from the browser.
*/

CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'ultra', 'exclusive')),
  audits_used integer NOT NULL DEFAULT 0 CHECK (audits_used >= 0),
  period_start timestamptz NOT NULL DEFAULT now(),
  agency_logo_data text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE (agency_logo_data) ON profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile_logo" ON profiles;
CREATE POLICY "update_own_profile_logo" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  target_url text NOT NULL,
  target_kind text NOT NULL CHECK (target_kind IN ('website', 'google_maps')),
  business_name text,
  pagespeed_score integer NOT NULL CHECK (pagespeed_score BETWEEN 0 AND 100),
  mobile_load_time_s numeric(4,2) NOT NULL,
  review_rating numeric(2,1),
  review_count integer,
  competitor_rating numeric(2,1),
  competitor_review_count integer,
  seo_checks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audits_user_created_idx ON audits (user_id, created_at DESC);

ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON audits TO authenticated;

DROP POLICY IF EXISTS "select_own_audits" ON audits;
CREATE POLICY "select_own_audits" ON audits FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, COALESCE(NEW.email, ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

INSERT INTO profiles (user_id, email)
SELECT id, COALESCE(email, '') FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION set_plan(p_plan text)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_SIGNED_IN';
  END IF;
  IF p_plan NOT IN ('free', 'pro', 'ultra', 'exclusive') THEN
    RAISE EXCEPTION 'INVALID_PLAN';
  END IF;

  UPDATE profiles SET plan = p_plan
  WHERE user_id = auth.uid()
  RETURNING * INTO v_row;

  IF v_row.user_id IS NULL THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND';
  END IF;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_plan(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION set_plan(text) TO authenticated;

CREATE OR REPLACE FUNCTION record_audit(p_payload jsonb)
RETURNS audits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile profiles;
  v_limit integer;
  v_row audits;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_SIGNED_IN';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = v_uid FOR UPDATE;
  IF v_profile.user_id IS NULL THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND';
  END IF;

  IF v_profile.period_start + interval '1 month' <= now() THEN
    v_profile.audits_used := 0;
    v_profile.period_start := now();
  END IF;

  v_limit := CASE v_profile.plan
    WHEN 'free' THEN 3
    WHEN 'pro' THEN 25
    WHEN 'ultra' THEN 100
    ELSE NULL
  END;

  IF v_limit IS NOT NULL AND v_profile.audits_used >= v_limit THEN
    RAISE EXCEPTION 'AUDIT_LIMIT_REACHED';
  END IF;

  UPDATE profiles
  SET audits_used = v_profile.audits_used + 1,
      period_start = v_profile.period_start
  WHERE user_id = v_uid;

  INSERT INTO audits (
    user_id, target_url, target_kind, business_name,
    pagespeed_score, mobile_load_time_s,
    review_rating, review_count,
    competitor_rating, competitor_review_count,
    seo_checks
  ) VALUES (
    v_uid,
    p_payload->>'target_url',
    p_payload->>'target_kind',
    p_payload->>'business_name',
    (p_payload->>'pagespeed_score')::integer,
    (p_payload->>'mobile_load_time_s')::numeric,
    (p_payload->>'review_rating')::numeric,
    (p_payload->>'review_count')::integer,
    (p_payload->>'competitor_rating')::numeric,
    (p_payload->>'competitor_review_count')::integer,
    COALESCE(p_payload->'seo_checks', '[]'::jsonb)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION record_audit(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION record_audit(jsonb) TO authenticated;
