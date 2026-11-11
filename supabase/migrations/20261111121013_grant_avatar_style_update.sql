/*
# Allow updating avatar_style on profiles

1. Changes
- Replace the column-scoped UPDATE grant on profiles so authenticated users can update
  both `agency_logo_data` and `avatar_style` on their own row.
- The existing `update_own_profile_logo` RLS policy already enforces ownership
  (auth.uid() = user_id), so this grant only opens the columns the policy already guards.
*/

REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (agency_logo_data, avatar_style) ON profiles TO authenticated;
