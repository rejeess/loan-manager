# API Integration Plan

The current app uses local fixtures in `data/seed.ts`. It is intentionally shaped so those fixtures can be replaced by real data access without redesigning the UI.

## Higher Environment Readiness

The app can work in upper environments with real APIs after these pieces are added:

- Supabase project and environment variables.
- Database migrations from `docs/data-model.md`.
- RLS policies for owner and clerk access.
- Supabase Auth and protected routes.
- Typed data access in `lib/db/`.
- Server Actions for mutations.
- Optional Supabase Realtime subscriptions for live payment/customer updates.

## Environment Variables

Expected future variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
CRON_SECRET=
RESEND_API_KEY=
SENTRY_DSN=
```

Only `NEXT_PUBLIC_*` values may be used in client components.

## Data Flow

Reads:

1. Server Component calls `lib/db/*` query helper.
2. Query helper uses the Supabase server client.
3. RLS limits rows by authenticated user and selected company.
4. Component renders typed data.

Mutations:

1. Form submits to Server Action.
2. Server Action validates input.
3. Server Action writes domain row and audit log in one transaction where possible.
4. UI revalidates the affected route or query.

Realtime:

- Use Supabase Realtime sparingly.
- Good candidates: payments list, DCS lookup summary, long-pending tracker.
- Avoid using realtime as the source of truth; it is only a freshness layer.

