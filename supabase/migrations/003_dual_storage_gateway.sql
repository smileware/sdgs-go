create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.events (slug, name)
values ('sustrend-2027', 'SUSTREND 2027')
on conflict (slug) do nothing;

alter table public.participants
  add column if not exists event_id uuid references public.events(id),
  add column if not exists device_id uuid,
  add column if not exists age smallint;

update public.participants
set
  event_id = coalesce(event_id, (select id from public.events where slug = 'sustrend-2027')),
  device_id = coalesce(device_id, gen_random_uuid()),
  age = coalesce(
    age,
    case when age_range ~ '^[0-9]{1,3}$' then age_range::smallint else null end
  )
where event_id is null or device_id is null or age is null;

alter table public.participants
  drop constraint if exists participants_age_check;
alter table public.participants
  add constraint participants_age_check check (age is null or age between 1 and 120);

alter table public.plays
  add column if not exists submission_id uuid,
  add column if not exists event_id uuid references public.events(id),
  add column if not exists card_set_version text,
  add column if not exists client_completed_at timestamptz,
  add column if not exists created_at timestamptz,
  add column if not exists payload jsonb,
  add column if not exists payload_hash text,
  add column if not exists sheet_synced_at timestamptz;

update public.plays p
set
  submission_id = coalesce(p.submission_id, p.id),
  event_id = coalesce(p.event_id, participant.event_id),
  card_set_version = coalesce(p.card_set_version, 'legacy'),
  client_completed_at = coalesce(p.client_completed_at, p.completed_at),
  created_at = coalesce(p.created_at, p.completed_at)
from public.participants participant
where participant.id = p.participant_id
  and (
    p.submission_id is null
    or p.event_id is null
    or p.card_set_version is null
    or p.client_completed_at is null
    or p.created_at is null
  );

alter table public.plays
  alter column created_at set default now(),
  alter column created_at set not null;

create unique index if not exists plays_submission_id_key on public.plays (submission_id);
create index if not exists participants_event_id_idx on public.participants (event_id);
create index if not exists plays_event_id_created_at_idx on public.plays (event_id, created_at);
create index if not exists plays_pending_sheet_idx on public.plays (created_at)
  where sheet_synced_at is null and payload is not null;

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  action text not null,
  ip_address text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "public can register" on public.participants;
drop policy if exists "public can submit completed plays" on public.plays;
revoke insert on public.participants, public.plays from anon;
revoke all on public.events, public.admin_audit_log from anon, authenticated;
revoke execute on function public.get_dashboard_summary() from anon, authenticated;

create or replace function public.submit_play_v1(
  p_payload jsonb,
  p_payload_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_submission_id uuid := (p_payload->>'submissionId')::uuid;
  v_participant_id uuid := (p_payload->>'participantId')::uuid;
  v_existing_hash text;
  v_responses jsonb := p_payload->'responses';
begin
  if p_payload->>'version' <> '1' then
    raise exception 'invalid_payload_version';
  end if;
  if jsonb_typeof(v_responses) <> 'array' or jsonb_array_length(v_responses) <> 15 then
    raise exception 'invalid_responses';
  end if;
  if (select count(distinct item->>'cardId') from jsonb_array_elements(v_responses) item) <> 15 then
    raise exception 'duplicate_cards';
  end if;
  if exists (
    select 1
    from unnest(array['people', 'prosperity', 'planet', 'peace', 'partnership']) category
    where (select count(*) from jsonb_array_elements(v_responses) item where item->>'category' = category) <> 3
  ) then
    raise exception 'invalid_category_distribution';
  end if;
  if ((p_payload->'player'->>'age')::int not between 1 and 120) then
    raise exception 'invalid_age';
  end if;
  if length(coalesce(p_payload->'player'->>'phone', '')) > 30 then
    raise exception 'invalid_phone';
  end if;

  select payload_hash into v_existing_hash
  from public.plays
  where submission_id = v_submission_id;

  if found then
    if v_existing_hash is distinct from p_payload_hash then
      raise exception 'submission_conflict';
    end if;
    return jsonb_build_object('duplicate', true, 'submissionId', v_submission_id);
  end if;

  insert into public.events (slug, name)
  values (p_payload->>'eventSlug', p_payload->>'eventSlug')
  on conflict (slug) do update set slug = excluded.slug
  returning id into v_event_id;

  insert into public.participants (
    id,
    event_id,
    device_id,
    nickname,
    age_range,
    age,
    gender,
    phone,
    privacy_accepted_at,
    privacy_version,
    marketing_accepted_at
  ) values (
    v_participant_id,
    v_event_id,
    (p_payload->>'deviceId')::uuid,
    p_payload->'player'->>'nickname',
    p_payload->'player'->>'age',
    (p_payload->'player'->>'age')::smallint,
    p_payload->'player'->>'gender',
    nullif(p_payload->'player'->>'phone', ''),
    (p_payload->'player'->>'privacyAcceptedAt')::timestamptz,
    p_payload->'player'->>'privacyVersion',
    null
  )
  on conflict (id) do nothing;

  insert into public.plays (
    id,
    submission_id,
    participant_id,
    event_id,
    character,
    scores,
    responses,
    card_set_version,
    client_completed_at,
    completed_at,
    payload,
    payload_hash
  ) values (
    v_submission_id,
    v_submission_id,
    v_participant_id,
    v_event_id,
    p_payload->'result'->>'character',
    p_payload->'result'->'scores',
    v_responses,
    p_payload->>'cardSetVersion',
    (p_payload->>'clientCompletedAt')::timestamptz,
    now(),
    p_payload,
    p_payload_hash
  );

  return jsonb_build_object('duplicate', false, 'submissionId', v_submission_id);
end;
$$;

create or replace function public.get_dashboard_summary_admin(p_event_slug text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with selected_event as (
    select id from public.events where slug = p_event_slug
  ), first_plays as (
    select distinct on (participant_id) participant_id, character
    from public.plays
    where event_id = (select id from selected_event)
    order by participant_id, created_at asc
  ), character_counts as (
    select character, count(*)::int as count
    from first_plays
    group by character
  ), totals as (
    select
      (select count(*)::int from first_plays) as total_players,
      (select count(*)::int from public.plays where event_id = (select id from selected_event)) as total_plays
  )
  select jsonb_build_object(
    'totalPlayers', totals.total_players,
    'totalPlays', totals.total_plays,
    'updatedAt', now(),
    'characters', coalesce((
      select jsonb_agg(jsonb_build_object(
        'character', character,
        'count', count,
        'percentage', case when totals.total_players = 0 then 0
          else round((count::numeric / totals.total_players::numeric) * 100, 1) end
      ) order by count desc)
      from character_counts
    ), '[]'::jsonb)
  )
  from totals;
$$;

create or replace function public.export_submissions_v1(p_event_slug text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'submissionId', p.submission_id,
    'eventSlug', e.slug,
    'participantId', participant.id,
    'deviceId', participant.device_id,
    'nickname', participant.nickname,
    'age', participant.age,
    'gender', participant.gender,
    'phone', participant.phone,
    'privacyVersion', participant.privacy_version,
    'privacyAcceptedAt', participant.privacy_accepted_at,
    'cardSetVersion', p.card_set_version,
    'character', p.character,
    'scores', p.scores,
    'responses', p.responses,
    'clientCompletedAt', p.client_completed_at
  ) order by p.created_at), '[]'::jsonb)
  from public.plays p
  join public.participants participant on participant.id = p.participant_id
  join public.events e on e.id = p.event_id
  where e.slug = p_event_slug;
$$;

create or replace function public.get_pending_sheet_submissions_v1(p_limit int default 100)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'payload', payload,
    'payloadHash', payload_hash
  ) order by created_at), '[]'::jsonb)
  from (
    select payload, payload_hash, created_at
    from public.plays
    where sheet_synced_at is null and payload is not null
    order by created_at
    limit least(greatest(p_limit, 1), 100)
  ) pending;
$$;

create or replace function public.mark_sheet_synced_v1(p_submission_ids uuid[])
returns void
language sql
security definer
set search_path = public
as $$
  update public.plays
  set sheet_synced_at = coalesce(sheet_synced_at, now())
  where submission_id = any(p_submission_ids);
$$;

revoke all on function public.submit_play_v1(jsonb, text) from public;
revoke all on function public.get_dashboard_summary_admin(text) from public;
revoke all on function public.export_submissions_v1(text) from public;
revoke all on function public.get_pending_sheet_submissions_v1(int) from public;
revoke all on function public.mark_sheet_synced_v1(uuid[]) from public;

grant execute on function public.submit_play_v1(jsonb, text) to service_role;
grant execute on function public.get_dashboard_summary_admin(text) to service_role;
grant execute on function public.export_submissions_v1(text) to service_role;
grant execute on function public.get_pending_sheet_submissions_v1(int) to service_role;
grant execute on function public.mark_sheet_synced_v1(uuid[]) to service_role;
grant insert on public.admin_audit_log to service_role;
