-- Persist per-user UI preferences and standardize families-served aggregation.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  compact_mode boolean not null default false,
  email_notifications boolean not null default true,
  push_notifications boolean not null default true,
  system_updates boolean not null default false,
  theme_preference text not null default 'system'
    check (theme_preference in ('system', 'light', 'dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_user_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_preferences_updated_at on public.user_preferences;
create trigger trg_user_preferences_updated_at
before update on public.user_preferences
for each row execute function public.set_user_preferences_updated_at();

insert into public.user_preferences (user_id)
select up.id
from public.user_profiles up
on conflict (user_id) do nothing;

alter table public.user_preferences enable row level security;

drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own"
on public.user_preferences
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.user_profiles p
    where p.id = auth.uid() and p.role = 'Admin'
  )
);

drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own"
on public.user_preferences
for insert
to authenticated
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.user_profiles p
    where p.id = auth.uid() and p.role = 'Admin'
  )
);

drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own"
on public.user_preferences
for update
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.user_profiles p
    where p.id = auth.uid() and p.role = 'Admin'
  )
)
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.user_profiles p
    where p.id = auth.uid() and p.role = 'Admin'
  )
);

create or replace view public.food_distribution_household_metrics as
select
  fr.distribution_id,
  count(*) as recipient_rows,
  count(distinct coalesce(fr.family_group_id::text, fr.family_head_id::text)) as families_served
from public.food_recipients fr
group by fr.distribution_id;
