/*
  Allow users to delete their own audits.
  Important: Deleting an audit does NOT reduce audits_used count.
*/

-- Give delete permission
GRANT DELETE ON audits TO authenticated;

-- Policy so user can only delete their own audits
DROP POLICY IF EXISTS "delete_own_audits" ON audits;

CREATE POLICY "delete_own_audits"
  ON audits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);