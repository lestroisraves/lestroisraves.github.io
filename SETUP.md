# Supabase

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
