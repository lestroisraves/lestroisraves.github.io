# Supabase

## add trigger function when new user is created
When nex user is created with signup, you can trigger a function that will push the new user in profiles table, with some more attributes from meta-data.

Go to `Database > functions` and create new `trigger` function called `handle_new_user`

```sql
begin
  insert into public.profiles (id, name, role, status, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    0,
    new.raw_user_meta_data ->> 'status',
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
```

## Daily limit for publication

```sql
create or replace function public.check_daily_event_limit()
returns trigger
language plpgsql
as $$
declare
    event_count integer;
    user_role smallint;
    max_events integer;
begin
    select role
    into user_role
    from public.profiles
    where id = new.created_by;

    -- Define limits by role
    case
        when user_role >= 2 then
            return new; -- unlimited
        when user_role = 1 then
            max_events := 50;
        else
            max_events := 10;
    end case;

    select count(*)
    into event_count
    from public.events
    where created_by = new.created_by
      and created_at >= current_date
      and created_at < current_date + interval '1 day';

    if event_count >= max_events then
        raise exception
            'Limitation de publication atteinte (%)', max_events;
    end if;

    return new;
end;
$$;
```

Then:
```sql
create trigger trg_daily_event_limit
before insert on public.events
for each row
execute function public.check_daily_event_limit();
``
```

## Delete old events
In `Integration` be sure that `pg_cron` extension is installed so you can create a Job in `CRON`.

Job schedule:  `0 6 * * *` (everyday at 6:00 AM)

Job script:

```sql
DELETE FROM public.events
    WHERE event_date < CURRENT_DATE - INTERVAL '1 day';
```

## Only show events from today to future
Create a public SQL view

```sql
drop view public.future_events;
create view public.future_events
with
  (security_invoker = on) as
select
  *
from
  events
where
  event_date >= CURRENT_DATE;
```

✅ Runs entirely in Postgres
✅ CURRENT_DATE is evaluated at query time
✅ Always up‑to‑date
✅ No JS logic needed

! To update everytime events table structure changes (new column for example)
```
DROP VIEW IF EXISTS public.future_events
```

## Publish pending events after 3 days
In `Integration` be sure that `pg_cron` extension is installed so you can create a Job in `CRON`.

Job schedule:  `0 1 * * *` (everyday at 1:00 AM)

Job script:

```sql
UPDATE events
SET pending = false
WHERE pending = pending
AND created_at <= now() - interval '3 days';
```

## Visits

User here a `visits` table to log all connection from a anon or registered user. Only moderators can see statistics.

```sql
create table if not exists public.visits (
    visitor_id uuid not null,
    period text not null,                       -- 'YYYY-MM'
    first_seen timestamptz not null default now(),
    primary key (visitor_id, period)
);

alter table public.visits enable row level security;

-- anyone (logged in or not) can register a visit
create policy "visits_insert_any" on public.visits
    for insert to anon, authenticated
    with check (true);

-- only admins (role >= 3) can read visits for the stats tile
create policy "visits_select_admin" on public.visits
    for select to authenticated
    using (exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role >= 2
    ));
```