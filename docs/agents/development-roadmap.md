# Development Roadmap

This file turns the build plan into a practical agent handoff checklist.

## Current Status

Done:

- Next.js app scaffold.
- PWA manifest and service worker.
- Local mock dashboard, DCS lookup, product cards, payment form, long-pending tracker.
- Documentation extracted into normal Markdown.

Not done:

- Supabase schema.
- Auth.
- Real data.
- Server Actions.
- Tests.
- Deployment configuration.

## Next Agent Task: Phase 1 Foundation

Goal: owner and clerk can log in, switch company where allowed, and see protected placeholder screens.

Suggested order:

1. Add `.env.example`.
2. Install Supabase client packages.
3. Create `supabase/migrations/0001_foundation.sql`.
4. Create `lib/db/server.ts` and `lib/db/browser.ts`.
5. Add auth routes: `/login`, `/forgot-password`.
6. Add protected app group layout.
7. Add role-aware navigation and company switcher.
8. Add audit log table/query placeholder.

Definition of done:

- App builds.
- Owner seed user has both company memberships.
- Clerk seed user has one company membership.
- Unauthenticated users are redirected to login.
- Company switcher appears only for users with more than one company.

## Later Agent Tasks

Phase 2:

- Customers, DCS generation, ratings, notes, search.

Phase 3:

- Loans and payments, product rules, balance computation.

Phase 4:

- Fines, eligibility, rating suggestions.

Phase 5:

- Reports and long-pending tracker.

Phase 6:

- Reminders, WhatsApp tap-to-send, campaigns.

Phase 7:

- Offline support, test mode, polish, go-live.

