create extension if not exists pgcrypto;

create table if not exists public.participants (
  id uuid primary key,
  nickname text not null check (char_length(nickname) between 1 and 60),
  age_range text not null check (char_length(age_range) between 1 and 30),
  phone text null check (phone is null or char_length(phone) <= 30),
  privacy_accepted_at timestamptz not null,
  privacy_version text not null,
  marketing_accepted_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.plays (
  id uuid primary key,
  participant_id uuid not null references public.participants(id) on delete cascade,
  character text not null check (character in ('people', 'prosperity', 'planet', 'peace', 'partnership', 'all-rounder')),
  scores jsonb not null,
  responses jsonb not null,
  completed_at timestamptz not null default now()
);

alter table public.participants enable row level security;
alter table public.plays enable row level security;

create policy "public can register"
on public.participants for insert
to anon
with check (privacy_accepted_at is not null);

create policy "public can submit completed plays"
on public.plays for insert
to anon
with check (jsonb_array_length(responses) = 15);

create or replace function public.get_dashboard_summary()
returns jsonb
language sql
security definer
set search_path = public
as $$
  with first_plays as (
    select distinct on (participant_id) participant_id, character
    from public.plays
    order by participant_id, completed_at asc
  ), character_counts as (
    select character, count(*)::int as count
    from first_plays
    group by character
  ), totals as (
    select
      (select count(*)::int from first_plays) as total_players,
      (select count(*)::int from public.plays) as total_plays
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

revoke all on function public.get_dashboard_summary() from public;
grant execute on function public.get_dashboard_summary() to anon, authenticated;
grant insert on public.participants, public.plays to anon;
