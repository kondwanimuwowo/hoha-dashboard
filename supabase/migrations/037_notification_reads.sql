-- Migration 037: Notification Read Tracking
-- Stores which notifications each user has dismissed/read.
-- Notifications themselves are computed live from existing tables;
-- only the read state is persisted here.

CREATE TABLE public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_key text NOT NULL,
  read_at timestamptz DEFAULT now(),
  CONSTRAINT notification_reads_unique UNIQUE (user_id, notification_key)
);

CREATE INDEX idx_notification_reads_user ON notification_reads(user_id);

ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reads" ON notification_reads
  FOR ALL USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload config';
