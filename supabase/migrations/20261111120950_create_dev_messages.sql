/*
# Create dev_messages table for private 1-on-1 developer feedback chat

1. New Tables
- `dev_messages`
  - `id` (uuid, primary key)
  - `sender_email` (text, not null) — email of the logged-in sender
  - `recipient_email` (text, not null) — email of the intended recipient
  - `body` (text, not null) — the message text
  - `read_at` (timestamptz, nullable) — when the recipient read it
  - `created_at` (timestamptz, default now())
  Each row is one message in a private thread between a user and the developer.

2. How privacy works
- The developer's email is fixed at maoun2012@gmail.com.
- A user sends a message with sender_email = their own email and recipient_email = 'maoun2012@gmail.com'.
- The developer replies with sender_email = 'maoun2012@gmail.com' and recipient_email = the user's email.
- RLS lets an authenticated user read/insert rows ONLY where their own auth email is either
  the sender OR the recipient. So only the two participants of a thread can see it.

3. Security
- Enable RLS on `dev_messages`.
- Grant SELECT, INSERT, UPDATE to `authenticated` only (no anon: app requires sign-in).
- SELECT policy: auth.jwt()->>'email' matches sender_email OR recipient_email.
- INSERT policy: the sender's auth email must equal sender_email (you can only send as yourself).
- UPDATE policy: only the recipient can mark a message read (auth email = recipient_email).
- No DELETE: messages are preserved.
- Add an index on the email pair + created_at for fast thread loading.
*/

CREATE TABLE IF NOT EXISTS dev_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_email text NOT NULL,
  recipient_email text NOT NULL,
  body text NOT NULL CHECK (char_length(trim(body)) > 0),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dev_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON dev_messages TO authenticated;

CREATE INDEX IF NOT EXISTS dev_messages_thread_idx
  ON dev_messages (least(sender_email, recipient_email), greatest(sender_email, recipient_email), created_at DESC);

DROP POLICY IF EXISTS "read_own_thread" ON dev_messages;
CREATE POLICY "read_own_thread"
  ON dev_messages FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = sender_email
    OR auth.jwt() ->> 'email' = recipient_email
  );

DROP POLICY IF EXISTS "insert_as_sender" ON dev_messages;
CREATE POLICY "insert_as_sender"
  ON dev_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = sender_email);

DROP POLICY IF EXISTS "mark_read_as_recipient" ON dev_messages;
CREATE POLICY "mark_read_as_recipient"
  ON dev_messages FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = recipient_email)
  WITH CHECK (auth.jwt() ->> 'email' = recipient_email);
