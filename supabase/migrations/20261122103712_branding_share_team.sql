/*
# Branding, share links, client tags, and team seats

1. Changes to existing tables
- `profiles`: add `brand_color` (text, nullable — hex like #6366f1) and
  `agency_name` (text, nullable). Used on white-label PDFs and reports.
- `audits`: add `share_token` (text, unique, nullable), `is_share_enabled`
  (boolean, not null, default false), and `client_tag` (text, nullable).
  A shared link is only readable while is_share_enabled = true.

2. New Tables
- `team_members` (Exclusive-plan team seats)
  - `id` (uuid, primary key)
  - `owner_id` (uuid, references auth.users, the agency owner)
  - `member_email` (text, not null)
  - `status` (text, not null, default 'invited')
  - `created_at` (timestamptz)

3. Security
- `profiles`: authenticated users may update only agency_logo_data,
  avatar_style, brand_color, agency_name on their own row.
- `audits`: new SELECT policy lets anonymous (not signed-in) visitors read
  ONLY audits where is_share_enabled = true — this powers the public share
  page. Signed-in users keep read access to published or own audits.
  Owners may update is_share_enabled/share_token/client_tag on own audits
  (column-scoped grant; usage counters remain protected by functions).
- `team_members`: RLS enabled. Owners can read/insert/delete rows for their
  own workspace (owner_id = auth.uid()). Members can read rows where
  member_email matches their own auth email. Grants to authenticated only.

4. Important Notes
- Sharing is opt-in only. Unpublished + unshared audits stay private.
- The public share page fetches with the anon key, hence the anon SELECT
  policy gated on is_share_enabled.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_color text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agency_name text;

ALTER TABLE audits ADD COLUMN IF NOT EXISTS share_token text;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS is_share_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS client_tag text;

CREATE UNIQUE INDEX IF NOT EXISTS audits_share_token_idx ON audits (share_token) WHERE share_token IS NOT NULL;

REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (agency_logo_data, avatar_style, brand_color, agency_name) ON profiles TO authenticated;

REVOKE SELECT ON audits FROM authenticated;
GRANT SELECT ON audits TO authenticated;
GRANT UPDATE (is_published, published_at, is_share_enabled, share_token, client_tag) ON audits TO authenticated;

-- Anonymous (not signed in) visitors may read ONLY share-enabled audits (public share page).
DROP POLICY IF EXISTS "select_share_enabled_audits_anon" ON audits;
CREATE POLICY "select_share_enabled_audits_anon"
  ON audits FOR SELECT
  TO anon
  USING (is_share_enabled = true);

DROP POLICY IF EXISTS "select_published_or_own_audits" ON audits;
CREATE POLICY "select_published_or_own_audits"
  ON audits FOR SELECT
  TO authenticated
  USING (is_published = true OR auth.uid() = user_id);

-- comments: allow anon reads on share-enabled audits' comments? Not needed; comments stay authenticated-only.

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  member_email text NOT NULL,
  status text NOT NULL DEFAULT 'invited',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON team_members TO authenticated;

DROP POLICY IF EXISTS "owner_select_team" ON team_members;
CREATE POLICY "owner_select_team"
  ON team_members FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id OR lower(member_email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

DROP POLICY IF EXISTS "owner_insert_team" ON team_members;
CREATE POLICY "owner_insert_team"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "owner_delete_team" ON team_members;
CREATE POLICY "owner_delete_team"
  ON team_members FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);
