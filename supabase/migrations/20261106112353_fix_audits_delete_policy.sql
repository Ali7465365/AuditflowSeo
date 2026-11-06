/*
  Fix: audits DELETE policy was missing in the live database.
  With RLS enabled and no DELETE policy, every delete was silently blocked,
  so deleted audits reappeared after logout/login.

  This migration adds the DELETE policy so users can permanently delete their own audits.
  audits_used is intentionally NOT touched — deleted audits stay counted.
*/

DROP POLICY IF EXISTS "delete_own_audits" ON audits;

CREATE POLICY "delete_own_audits"
  ON audits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
