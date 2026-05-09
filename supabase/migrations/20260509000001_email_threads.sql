-- Email threads table: stores inbound and outbound email conversations
-- linked to sourcing candidates.

create table if not exists email_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  candidate_id uuid references sourcing_candidates(id) on delete set null,
  subject text not null,
  from_email text not null,
  from_name text,
  to_email text not null,
  body_text text,
  body_html text,
  message_id text unique,
  in_reply_to text,
  thread_id text,
  direction text not null check (direction in ('outbound', 'inbound')),
  sent_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists email_threads_candidate_id_idx on email_threads(candidate_id);
create index if not exists email_threads_thread_id_idx on email_threads(thread_id);
create index if not exists email_threads_user_id_idx on email_threads(user_id);

alter table email_threads enable row level security;

do $$ begin
  create policy "Users can manage their own email threads"
    on email_threads for all using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
