alter table public.plays
  drop constraint if exists plays_character_check;

update public.plays
set character = 'balanced'
where character = 'all-rounder';

alter table public.plays
  add constraint plays_character_check check (
    character in (
      'people',
      'prosperity',
      'planet',
      'peace',
      'partnership',
      'balanced',
      'no-score'
    )
  );
