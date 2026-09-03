# Supabase

## Tables

### profile

```sql
create table public.profiles (
  id uuid not null default gen_random_uuid (),
  name text not null,
  role smallint not null default '0'::smallint,
  created_at timestamp with time zone not null default now(),
  official_request boolean not null default false,
  official_request_details text not null default 'EMPTY'::text,
  email character varying not null,
  status integer not null default 0,
  label text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;
```

### events

```sql
create table public.events (
  id uuid not null default gen_random_uuid (),
  title text not null,
  event_date date not null,
  event_start_time time without time zone null,
  location_name text not null,
  location_address text not null,
  tags text[] not null default '{}'::text[],
  created_at timestamp without time zone not null default now(),
  created_by uuid not null,
  is_test boolean not null default false,
  long_description text null,
  pending boolean not null default true,
  min_price double precision null,
  category smallint[] not null,
  max_price double precision null,
  image_url text null,
  phone text null,
  site_url text null,
  to_eat boolean null,
  price integer not null default 0,
  email character varying null,
  creator_name character varying null,
  min_age integer null,
  max_age integer null,
  location_address_2 text null,
  location_address_code numeric not null,
  location_address_town text not null,
  constraint events_pkey primary key (id),
  constraint events_created_by_fkey foreign KEY (created_by) references profiles (id) on update CASCADE on delete set null
) TABLESPACE pg_default;

alter table public.events enable row level security;
```

### future_events

```sql
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

### visits

```sql
create table public.visits (
  visitor_id uuid not null,
  period text not null,
  first_seen timestamp with time zone not null default now(),
  constraint visits_pkey primary key (visitor_id, period)
) TABLESPACE pg_default;

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

### Trigger Functions

## Daily limit for publication

Before publication of new event, check that daily publication limit for this user has not been reached.

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

create trigger trg_daily_event_limit BEFORE INSERT on public.events for EACH row
execute function check_daily_event_limit ();
```

## Update profiles when new user is created

When new user is created with signup, you can trigger a function that will push the new user in profiles table, with some more attributes from meta-data.

```sql
create or replace function public.check_daily_event_limit()
returns trigger
language plpgsql
as $$
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
$$;

create trigger on_auth_user_created after insert on auth.users for each row
execute function public.handle_new_user();
```

## RLS policies



## CRON job

### Delete old events

In `Integration` be sure that `pg_cron` extension is installed so you can create a Job in `CRON`.

Job schedule:  `0 6 * * *` (everyday at 6:00 AM)

Job script:

```sql
DELETE FROM public.events
    WHERE event_date < CURRENT_DATE - INTERVAL '1 day';
```

### Publish pending events after 3 days

In `Integration` be sure that `pg_cron` extension is installed so you can create a Job in `CRON`.

Job schedule:  `0 1 * * *` (everyday at 1:00 AM)

Job script:

```sql
UPDATE events
SET pending = false
WHERE pending = pending
AND created_at <= now() - interval '3 days';
```
