/*
# Public feed + comments for audits

1. Changes to existing tables
- `audits`: add `is_published` (boolean, not null, default false) and
  `published_at` (timestamptz, nullable). Private audits stay private until
  the owner publishes them. No auto-publish.
- The existing `record_audit` function inserts audits without these columns;
  they default to false/null, so creating an audit never publishes it.

2. New Tables
- `audit_comments`
  - `id` (uuid, primary key)
  - `audit_id` (uuid, references audits(id) on delete cascade)
  - `user_id` (uuid, references auth.users(id) on delete cascade)
  - `author_email` (text, not null, default '')
  - `body` (text, not null, must not be empty/whitespace)
  - `created_at` (timestamptz, not null, default now())

3. Security
- `audits` SELECT: authenticated users can read an audit if it is published
  OR they own it. (Replaces the previous owner-only SELECT policy so the feed
  can list published audits to all signed-in users.)
- `audits` UPDATE: owner only, and only the `is_published` and `published_at`
  columns may change via the column-scoped grant. Plan/usage counters remain
  protected by the existing SECURITY DEFINER functions.
- `audit_comments` SELECT: authenticated users can read comments on published
  audits, or on audits they own.
- `audit_comments` INSERT: authenticated users can insert their own comments
  (user_id = auth.uid()) only on published audits.
- `audit_comments` DELETE: users can delete only their own comments.
- Grants are column-scoped for audits UPDATE (is_published, published_at) and
  full CRUD for audit_comments to authenticated.

4. Important Notes
- The publish/unpublish action only touches is_published and published_at.
  audits_used and plan counters are NOT affected.
- Comments are limited to 500 characters on the client side; the body CHECK
  only enforces non-empty.
*/

ALTER TABLE audits ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE INDEX IF NOT EXISTS audits_published_idx ON audits (published_at DESC) WHERE is_published = true;

REVOKE SELECT ON audits FROM authenticated;
GRANT SELECT ON audits TO authenticated;
GRANT UPDATE (is_published, published_at) ON audits TO authenticated;

DROP POLICY IF EXISTS "select_own_audits" ON audits;
CREATE POLICY "select_published_or_own_audits"
  ON audits FOR SELECT
  TO authenticated
  USING (is_published = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_audit_publish" ON audits;
CREATE POLICY "update_own_audit_publish"
  ON audits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS audit_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  author_email text NOT NULL DEFAULT '',
  body text NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_comments_audit_idx ON audit_comments (audit_id, created_at ASC);

ALTER TABLE audit_comments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON audit_comments TO authenticated;

DROP POLICY IF EXISTS "select_comments_on_published_or_own" ON audit_comments;
CREATE POLICY "select_comments_on_published_or_own"
  ON audit_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = audit_comments.audit_id
        AND (audits.is_published = true OR audits.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "insert_own_comment_on_published" ON audit_comments;
CREATE POLICY "insert_own_comment_on_published"
  ON audit_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = audit_comments.audit_id
        AND audits.is_published = true
    )
  );

DROP POLICY IF EXISTS "delete_own_comment" ON audit_comments;
CREATE POLICY "delete_own_comment"
  ON audit_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
