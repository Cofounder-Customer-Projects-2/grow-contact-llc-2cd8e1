-- Add notification preferences to profiles
alter table public.profiles
  add column if not exists notification_prefs jsonb not null default '{"new_reply":true,"shortlist_alert":true,"interview_reminder":true}'::jsonb;

comment on column public.profiles.notification_prefs is
  'User notification preference flags';
