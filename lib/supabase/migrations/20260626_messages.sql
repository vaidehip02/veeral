-- ── Conversations ────────────────────────────────────────────────────────────

create table if not exists public.conversations (
  id                  uuid default gen_random_uuid() primary key,
  participant_a_id    uuid references auth.users(id) on delete cascade not null,
  participant_b_id    uuid references auth.users(id) on delete cascade not null,
  listing_id          uuid references public.listings(id) on delete set null,
  order_id            uuid references public.orders(id) on delete set null,
  last_message_at     timestamptz,
  last_message_preview text,
  a_last_read_at      timestamptz,
  b_last_read_at      timestamptz,
  created_at          timestamptz default now(),

  -- one thread per ordered pair of users + listing (null treated as the same bucket)
  constraint conversations_unique_pair unique (
    least(participant_a_id::text, participant_b_id::text),
    greatest(participant_a_id::text, participant_b_id::text),
    listing_id
  )
);

create index if not exists conversations_a_idx on public.conversations(participant_a_id);
create index if not exists conversations_b_idx on public.conversations(participant_b_id);
create index if not exists conversations_last_msg_idx on public.conversations(last_message_at desc);

-- ── Messages ──────────────────────────────────────────────────────────────────

create table if not exists public.messages (
  id              uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id       uuid references auth.users(id) on delete cascade not null,
  body            text not null check (char_length(body) between 1 and 4000),
  created_at      timestamptz default now()
);

create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

-- Conversations: only the two participants (or admins) can see them
create policy "conversations_select"
  on public.conversations for select
  using (
    auth.uid() = participant_a_id
    or auth.uid() = participant_b_id
    or exists (
      select 1 from public.profiles where id = auth.uid() and is_admin = true
    )
  );

-- Only participants can create conversations they belong to
create policy "conversations_insert"
  on public.conversations for insert
  with check (
    auth.uid() = participant_a_id
    or auth.uid() = participant_b_id
  );

-- Only participants can update their own last_read_at (and last_message fields)
create policy "conversations_update"
  on public.conversations for update
  using (
    auth.uid() = participant_a_id
    or auth.uid() = participant_b_id
  );

-- Messages: only participants in the conversation (or admins) can read
create policy "messages_select"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.participant_a_id = auth.uid() or c.participant_b_id = auth.uid())
    )
    or exists (
      select 1 from public.profiles where id = auth.uid() and is_admin = true
    )
  );

-- Only participants can send into a conversation they belong to
create policy "messages_insert"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.participant_a_id = auth.uid() or c.participant_b_id = auth.uid())
    )
  );

-- ── Realtime ──────────────────────────────────────────────────────────────────
-- Run this AFTER the table is created to enable live message delivery:
--   alter publication supabase_realtime add table public.messages;
-- (Supabase dashboard → Database → Replication, or paste in SQL editor)
