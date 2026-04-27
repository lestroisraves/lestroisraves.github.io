# Supabase

## Only show events from today to future
Create a public SQL view

```sql
CREATE VIEW public.future_events AS
WITH
  (security_invoker = on) as
SELECT *
FROM public.events
WHERE event_date >= CURRENT_DATE;
```

✅ Runs entirely in Postgres
✅ CURRENT_DATE is evaluated at query time
✅ Always up‑to‑date
✅ No JS logic needed

! To update everytime events table structure changes (new column for example)
```
DROP VIEW IF EXISTS public.future_events
```