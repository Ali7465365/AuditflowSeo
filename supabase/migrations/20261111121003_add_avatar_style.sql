/*
# Add avatar_style to profiles

1. Changes
- Add `avatar_style` (jsonb, nullable) to `profiles`. Stores the user's saved avatar
  customization (background color, text color, shape, ring, size, etc.) as a JSON object.
  Null means use the default indigo circular avatar.

2. Security
- Extend the existing UPDATE grant on profiles to include the new `avatar_style` column
  so authenticated users can save their own avatar style.
- The existing `update_own_profile_logo` policy already restricts updates to the owner
  (auth.uid() = user_id WITH CHECK auth.uid() = user_id), so avatar_style updates are
  covered by the same ownership check.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_style jsonb;
