alter table public.participants
add column if not exists gender text;

alter table public.participants
drop constraint if exists participants_gender_check;

alter table public.participants
add constraint participants_gender_check
check (gender in ('male', 'female', 'unspecified'));
