# Loan Manager Agent Guide

This repository is a Next.js Progressive Web App for two Kerala finance companies: Jeevana Loans and Phenix Money & More. Treat the documents in `docs/` as product requirements, not loose inspiration.

## Current App State

- The app currently runs from local mock data in `data/seed.ts`.
- The UI is a first PWA shell, not a production data implementation.
- The original `Loan-Manager-Complete-Documentation.md` is a Word document package with a `.md` extension. Work from the extracted Markdown files in `docs/`.

## Tech Direction

- Framework: Next.js App Router, TypeScript strict mode.
- UI direction: mobile-first operational app, not a marketing site.
- Database target: Supabase Postgres with Row Level Security.
- Auth target: Supabase Auth, owner 2FA required later.
- Money: always integer paise in domain and persistence layers.
- Time: store UTC/timestamptz, display for Asia/Kolkata.
- PWA: keep manifest and service worker installability working as features are added.

## Global State Plan

Use the smallest state layer that fits each kind of state:

- Server state: Supabase/Postgres data through Server Components, Server Actions, and eventually TanStack Query for interactive client screens.
- Session state: Supabase Auth session and server-side user/company membership resolution.
- App UI state: selected company, language, sidebar/mobile navigation state, filters, and form drafts.
- Derived business state: do not store as global client state. Compute from events or query views, following `docs/architecture-hld.md`.

Recommended implementation order:

1. Keep current mock data as replaceable fixtures.
2. Add typed repositories under `lib/db/` that expose the same shapes as the mock data.
3. Add a `CompanyProvider` only for selected company and lightweight UI state.
4. Add TanStack Query when screens need live refetching, optimistic updates, or mutation persistence.

Avoid adding Redux/Zustand until there is a concrete state problem that React context plus server state does not solve.

## API And Upper Environment Plan

Yes, this app can work in higher environments with real APIs. The intended path is:

1. Supabase schema and RLS migrations in `supabase/migrations/`.
2. Environment variables for Supabase URL, anon key, service role key where needed, Sentry, Resend, and Vercel cron secrets.
3. Server Actions for form mutations.
4. Route Handlers for cron, exports, and future webhook-style integrations.
5. Realtime subscriptions only where useful, such as clerks seeing payment entries update live.

Never put service-role credentials in client components.

## Documentation Map

- Product requirements: `docs/product-spec.md`
- Architecture: `docs/architecture-hld.md`
- Database reference: `docs/data-model.md`
- Business logic: `docs/business-rules.md`
- API contracts: `docs/api-contracts.md`
- Build phases: `docs/build-plan.md`
- Phase slices: `docs/phases/`
- Glossary: `docs/glossary.md`

## Development Rules

- Preserve strict TypeScript. Do not introduce `any` or `@ts-ignore`.
- Keep domain logic in `lib/domain/` as pure functions.
- Keep database access in `lib/db/` or Server Actions, not UI components.
- Validate forms with shared Zod schemas once Zod is added.
- Keep components responsive at 375px width.
- Keep financial calculations auditable and covered by unit tests.
- Do not implement customer login. Customers only receive messages.
- Do not add online money transfer flows unless the relevant phase explicitly starts.

## Immediate Next Work

Phase 1 is the next serious implementation step:

- Add Supabase project config and initial migrations.
- Add auth pages and protected app shell.
- Replace mock companies with Supabase-backed companies.
- Add role-aware navigation.
- Add audit log foundation.

