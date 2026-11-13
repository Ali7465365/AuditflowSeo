]ALTER TABLE audits
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE TABLE IF NOT EXISTS audit_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_email text NOT NULL DEFAULT '',
  body text NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_comments_audit_id_idx
  ON audit_comments (audit_id, created_at ASC);

ALTER TABLE audit_comments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON audit_comments TO authenticated;

DROP POLICY IF EXISTS "read_published_audits" ON audits;
CREATE POLICY "read_published_audits"
  ON audits FOR SELECT
  TO authenticated
  USING (is_published = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_publish_audit" ON audits;
CREATE POLICY "owner_publish_audit"
  ON audits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "read_comments_on_visible_audits" ON audit_comments;
CREATE POLICY "read_comments_on_visible_audits"
  ON audit_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM audits a
      WHERE a.id = audit_id
        AND (a.is_published = true OR a.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "insert_own_comments" ON audit_comments;
CREATE POLICY "insert_own_comments"
  ON audit_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM audits a
      WHERE a.id = audit_id
        AND a.is_published = true
    )
  );

DROP POLICY IF EXISTS "delete_own_comments" ON audit_comments;
CREATE POLICY "delete_own_comments"
  ON audit_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);