-- Creator Radar — initial schema.
--
-- Access model:
--   * The discovery pipeline runs server-side with a direct Postgres connection
--     (DATABASE_URL, the `postgres` role) and bypasses RLS.
--   * The dashboard reads and writes through Supabase with the signed-in user's
--     JWT. Every table has RLS enabled; only users listed in `operators` can see
--     or change anything. Anonymous users get nothing.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.launch_classification as enum (
  'likely_new_launch',
  'possible_new_launch',
  'existing_creator_promotion',
  'needs_review'
);

create type public.review_status as enum ('pending', 'confirmed', 'dismissed');

create type public.scan_status as enum ('running', 'succeeded', 'partial', 'failed');

create type public.evidence_source as enum ('post', 'author_profile');

-- ---------------------------------------------------------------------------
-- Operators (who may use the dashboard)
-- ---------------------------------------------------------------------------

create table public.operators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.operators o where o.user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Settings (single row)
-- ---------------------------------------------------------------------------

create table public.settings (
  id smallint primary key default 1 check (id = 1),
  auto_scan_enabled boolean not null default true,
  scan_interval_minutes integer not null default 360
    check (scan_interval_minutes between 15 and 10080),
  search_terms text[] not null default array[
    'just launched my onlyfans',
    'finally made an onlyfans',
    'new onlyfans account',
    'my onlyfans is live',
    'just started my OF'
  ],
  minimum_confidence numeric(4, 3) not null default 0.400
    check (minimum_confidence >= 0 and minimum_confidence <= 1),
  notification_preferences jsonb not null default
    '{"webhook_enabled": false, "notify_on": "likely_new_launch"}'::jsonb,
  provider_configuration jsonb not null default
    '{"provider": "mock", "llm_enabled": false, "max_pages_per_query": 2, "max_results_per_page": 50, "retention_days": 90}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint search_terms_bounded check (
    cardinality(search_terms) between 1 and 25
  )
);

insert into public.settings (id) values (1);

-- ---------------------------------------------------------------------------
-- Scan runs, checkpoints, lock, provider health
-- ---------------------------------------------------------------------------

create table public.scan_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null check (trigger in ('manual', 'scheduled')),
  provider text not null check (provider in ('x', 'mock')),
  is_simulated boolean not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status public.scan_status not null default 'running',
  records_examined integer not null default 0,
  new_profiles_found integer not null default 0,
  new_events_recorded integer not null default 0,
  duplicates_skipped integer not null default 0,
  excluded_count integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  error_summary text,
  triggered_by uuid references auth.users (id) on delete set null
);

create index scan_runs_started_at_idx on public.scan_runs (started_at desc);

create table public.scan_checkpoints (
  provider text not null,
  query_key text not null,
  query text not null,
  since_id text not null check (since_id ~ '^[0-9]{1,25}$'),
  updated_at timestamptz not null default now(),
  primary key (provider, query_key)
);

create table public.scan_lock (
  id smallint primary key default 1 check (id = 1),
  holder text not null,
  acquired_at timestamptz not null,
  expires_at timestamptz not null
);

-- Lease-based lock: works through connection poolers (unlike session advisory
-- locks) and self-heals if a scan crashes without releasing it.
create or replace function public.acquire_scan_lock(p_holder text, p_ttl_seconds integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  n integer;
begin
  insert into public.scan_lock as l (id, holder, acquired_at, expires_at)
  values (1, p_holder, now(), now() + make_interval(secs => p_ttl_seconds))
  on conflict (id) do update
    set holder = excluded.holder,
        acquired_at = excluded.acquired_at,
        expires_at = excluded.expires_at
    where l.expires_at < now() or l.holder = excluded.holder;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

create or replace function public.release_scan_lock(p_holder text)
returns void
language sql
set search_path = ''
as $$
  delete from public.scan_lock where holder = p_holder;
$$;

create table public.provider_health (
  provider text primary key check (provider in ('x', 'mock')),
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error text,
  rate_limit_remaining integer,
  rate_limit_reset_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Creators and evidence
-- ---------------------------------------------------------------------------

create table public.creators (
  id uuid primary key default gen_random_uuid(),
  is_simulated boolean not null default false,
  public_display_name text check (char_length(public_display_name) <= 100),
  public_x_handle text not null check (public_x_handle ~ '^[A-Za-z0-9_]{1,15}$'),
  public_x_profile_url text not null check (public_x_profile_url ~ '^https://x\.com/[A-Za-z0-9_]{1,15}$'),
  advertised_creator_profile_url text
    check (advertised_creator_profile_url ~ '^https://onlyfans\.com/[a-z0-9._-]{2,60}$'),
  advertised_profile_slug text check (advertised_profile_slug ~ '^[a-z0-9._-]{2,60}$'),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  launch_status public.launch_classification not null,
  launch_confidence numeric(4, 3) not null check (launch_confidence >= 0 and launch_confidence <= 1),
  claimed_launch_date date,
  review_status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dedup keys. Simulated and live data are partitioned so they can never merge.
create unique index creators_handle_uniq
  on public.creators (is_simulated, lower(public_x_handle));
create unique index creators_slug_uniq
  on public.creators (is_simulated, advertised_profile_slug)
  where advertised_profile_slug is not null;
create index creators_first_seen_idx on public.creators (is_simulated, first_seen_at desc);
create index creators_status_idx on public.creators (is_simulated, launch_status, review_status);

create table public.discovery_events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  scan_run_id uuid references public.scan_runs (id) on delete set null,
  is_simulated boolean not null default false,
  source_platform text not null default 'x' check (source_platform in ('x')),
  source_post_id text not null check (source_post_id ~ '^[0-9]{1,25}$'),
  source_post_url text not null check (source_post_url ~ '^https://x\.com/[A-Za-z0-9_]{1,15}/status/[0-9]{1,25}$'),
  source_published_at timestamptz not null,
  discovered_at timestamptz not null default now(),
  search_term text,
  classification public.launch_classification not null,
  confidence numeric(4, 3) not null check (confidence >= 0 and confidence <= 1),
  explanation text not null check (char_length(explanation) <= 1000),
  classifier text not null check (classifier in ('rules', 'rules+llm')),
  matched_signals text[] not null default '{}',
  claimed_launch_date date,
  evidence_source public.evidence_source not null,
  extracted_profile_url text
    check (extracted_profile_url ~ '^https://onlyfans\.com/[a-z0-9._-]{2,60}$'),
  post_excerpt text check (char_length(post_excerpt) <= 500),
  compliance_checked_at timestamptz
);

create unique index discovery_events_post_uniq
  on public.discovery_events (is_simulated, source_platform, source_post_id);
create index discovery_events_creator_idx on public.discovery_events (creator_id, source_published_at desc);
create index discovery_events_discovered_idx on public.discovery_events (is_simulated, discovered_at desc);
create index discovery_events_compliance_idx
  on public.discovery_events (is_simulated, compliance_checked_at nulls first);

create table public.review_notes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null default auth.uid(),
  note text check (char_length(note) <= 2000),
  status_change public.review_status,
  created_at timestamptz not null default now(),
  constraint note_or_status check (note is not null or status_change is not null)
);

create index review_notes_creator_idx on public.review_notes (creator_id, created_at desc);

-- Removal requests. Only a SHA-256 hash of the normalized handle / profile slug
-- is kept, so a removed creator is not re-indexed without retaining who they are.
create table public.suppressions (
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger creators_touch before update on public.creators
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Feed view (security_invoker so the caller's RLS applies)
-- ---------------------------------------------------------------------------

create view public.creator_feed
with (security_invoker = true)
as
select
  c.*,
  e.id as latest_event_id,
  e.source_post_url as latest_source_post_url,
  e.source_published_at as latest_source_published_at,
  e.classification as latest_classification,
  e.confidence as latest_confidence,
  e.explanation as latest_explanation,
  (select count(*) from public.discovery_events d where d.creator_id = c.id) as event_count
from public.creators c
left join lateral (
  select * from public.discovery_events d
  where d.creator_id = c.id
  order by d.source_published_at desc
  limit 1
) e on true;

-- ---------------------------------------------------------------------------
-- Operator RPCs
-- ---------------------------------------------------------------------------

-- Delete a creator and all evidence; optionally prevent re-discovery.
create or replace function public.delete_creator(p_creator_id uuid, p_suppress boolean default true)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.creators;
begin
  if not public.is_operator() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into c from public.creators where id = p_creator_id;
  if not found then
    return;
  end if;

  if p_suppress then
    insert into public.suppressions (key_hash)
    values (encode(sha256(convert_to('x:' || lower(c.public_x_handle), 'UTF8')), 'hex'))
    on conflict do nothing;
    if c.advertised_profile_slug is not null then
      insert into public.suppressions (key_hash)
      values (encode(sha256(convert_to('of:' || c.advertised_profile_slug, 'UTF8')), 'hex'))
      on conflict do nothing;
    end if;
  end if;

  delete from public.creators where id = p_creator_id;
end;
$$;

-- Remove every simulated record (mock-mode data) in one go.
create or replace function public.purge_simulated_data()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  if not public.is_operator() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  delete from public.creators where is_simulated;
  get diagnostics n = row_count;
  delete from public.scan_runs where is_simulated;
  delete from public.scan_checkpoints where provider = 'mock';
  return n;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.operators enable row level security;
alter table public.settings enable row level security;
alter table public.scan_runs enable row level security;
alter table public.scan_checkpoints enable row level security;
alter table public.scan_lock enable row level security;
alter table public.provider_health enable row level security;
alter table public.creators enable row level security;
alter table public.discovery_events enable row level security;
alter table public.review_notes enable row level security;
alter table public.suppressions enable row level security;

create policy "operators read own row" on public.operators
  for select to authenticated using (user_id = auth.uid());

create policy "operators read settings" on public.settings
  for select to authenticated using (public.is_operator());
create policy "operators update settings" on public.settings
  for update to authenticated using (public.is_operator()) with check (public.is_operator());

create policy "operators read scan runs" on public.scan_runs
  for select to authenticated using (public.is_operator());

create policy "operators read provider health" on public.provider_health
  for select to authenticated using (public.is_operator());

create policy "operators read creators" on public.creators
  for select to authenticated using (public.is_operator());
create policy "operators update creators" on public.creators
  for update to authenticated using (public.is_operator()) with check (public.is_operator());
create policy "operators delete creators" on public.creators
  for delete to authenticated using (public.is_operator());

create policy "operators read events" on public.discovery_events
  for select to authenticated using (public.is_operator());
create policy "operators delete events" on public.discovery_events
  for delete to authenticated using (public.is_operator());

create policy "operators read notes" on public.review_notes
  for select to authenticated using (public.is_operator());
create policy "operators add notes" on public.review_notes
  for insert to authenticated with check (public.is_operator() and author_id = auth.uid());

-- scan_checkpoints, scan_lock, suppressions: no policies → service access only.

revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on function public.is_operator() to authenticated;
grant execute on function public.delete_creator(uuid, boolean) to authenticated;
grant execute on function public.purge_simulated_data() to authenticated;
revoke execute on function public.acquire_scan_lock(text, integer) from authenticated;
revoke execute on function public.release_scan_lock(text) from authenticated;
