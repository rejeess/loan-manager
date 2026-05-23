# Architecture (HLD)

This document describes how the system is built. For what it does, see product-spec.md (see Product Spec).

Audience: the developer building the system. Assumes familiarity with Next.js, SQLite/Drizzle, and modern web app patterns.

## 1. Architecture goals

In priority order:

Correctness of business rules. Money math, fines, eligibility, rating logic must be exact and auditable.

Owner data sovereignty. Owner owns the database, the code, every account. Zero developer lock-in.

Simplicity of operation. One developer should be able to maintain and extend this. Boring stack, well-understood patterns.

Performance for the user. Sub-second page loads on slow 4G. Optimistic UI for common writes.

Forward extensibility. Adding a third company or branch should not require a rewrite.

Non-goals: web-scale traffic, microservices, multi-region, real-time collaborative editing.

## 2. System context

[ Flow Diagram — renders natively in the GitHub repo / Markdown viewer ]

flowchart LR  Owner["Owner<br/>(phone / tablet / desktop)"]  Clerk["Clerk<br/>(phone / tablet)"]  App["Loan Manager<br/>(Next.js on Vercel)"]  DB[("SQLite<br/>+ Local File Storage")]  WA["WhatsApp<br/>(tap-to-send via wa.me)"]  Cron["Vercel Cron<br/>(daily / hourly jobs)"]  Mail["Email provider<br/>(notifications)"]  Owner -- HTTPS --> App  Clerk -- HTTPS --> App  App -- Drizzle ORM --> DB  App -- "wa.me deep links" --> WA  Cron -- triggers --> App  App -- "owner notifications" --> Mail

Customers never interact with the app directly. They only receive messages, sent through tap-to-send WhatsApp links the staff trigger.

## 3. Deployment topology

[ Flow Diagram — renders natively in the GitHub repo / Markdown viewer ]

flowchart TB  subgraph Vercel    NextApp["Next.js App<br/>(Server Components,<br/>Route Handlers,<br/>Server Actions)"]    CronJobs["Vercel Cron<br/>(scheduled functions)"]    DB[("SQLite<br/>(Drizzle ORM)")]    Auth["Better Auth"]    Storage["Local File Storage<br/>(/uploads — logos, photos)"]  end  subgraph External    Resend["Resend<br/>(transactional email)"]    Sentry["Sentry<br/>(error tracking)"]    GoogleDrive["Owner's Google Drive<br/>(weekly backup)"]  end  NextApp --> DB  NextApp --> Auth  NextApp --> Storage  NextApp --> Resend  NextApp --> Sentry  CronJobs --> NextApp  CronJobs --> GoogleDrive

### Why this topology:

Vercel + SQLite (Drizzle) + Better Auth is a simple, self-contained stack. One developer, near-zero ops.

All compute is serverless. Scales from zero to ~1000 concurrent users with no work.

Database is single-region (Singapore — closest to Kerala). Acceptable latency for this user base.

No Kubernetes, no Docker, no CI/CD platform to manage. Vercel handles deployment from main branch.

## 4. Tech stack — locked decisions

Runtime + package manager: Bun

Why: Bun is a fast all-in-one runtime that ships a built-in SQLite driver (`bun:sqlite`), a package manager, and a TypeScript runner. This eliminates `better-sqlite3`, `tsx`/`ts-node`, and reduces cold-start time. Use `bun` everywhere: `bun install`, `bun dev`, `bunx drizzle-kit`, `bun drizzle/seed.ts`.

Rules: Commit `bun.lockb` (not `package-lock.json`). Use `bunx` instead of `npx`. Scripts run with `bun <script>`.

Framework: Next.js 15 (App Router) + TypeScript

Why: Server Components reduce client JS dramatically (important on slow 4G). Server Actions remove most need for explicit API endpoints. Strong typing end-to-end with TypeScript. Excellent docs and AI training data for productivity.

Rules:

App Router only (no Pages Router).

Server Components by default. Client Components ("use client") only where genuine interactivity is needed (forms, charts, optimistic updates).

TypeScript strict mode. No any. No @ts-ignore. No as casts outside of carefully-justified boundary code.

ESLint with next/core-web-vitals and next/typescript configs, plus a few additions (see § 13).

Database: SQLite (`bun:sqlite`) with Drizzle ORM

Why: SQLite runs embedded in the process — no separate database server, no connection pools, no infra. Bun ships `bun:sqlite` natively so no extra package is needed. Drizzle's `bun-sqlite` adapter (`drizzle-orm/bun-sqlite`) wraps it with type-safe queries and migration management. The database file is a single portable artifact. At the scale of this app (~150 active loans) SQLite outperforms network-bound Postgres.

Rules:

All schema changes via Drizzle Kit migrations (`drizzle/migrations/`). Run `npx drizzle-kit generate` to create, `npx drizzle-kit migrate` to apply. Forward-only.

No Row Level Security — enforce access in Server Actions and middleware using the authenticated user's company memberships.

Use `integer` for money (paise) and counters. SQLite INTEGER is 64-bit signed (same range as Postgres bigint).

Use `text` for timestamps (ISO 8601 UTC strings). Never store as epoch integers.

Use `text` for all strings and UUIDs. Generate UUIDs in app code with `crypto.randomUUID()`.

Use `text` for JSON columns (serialize/deserialize in app code).

Foreign keys always set. ON DELETE set explicitly (almost always RESTRICT for business data; CASCADE only for audit/derived tables).

Auth: Better Auth (email + password, plus TOTP 2FA for owner)

Why: Framework-agnostic, self-hosted auth library with first-class Next.js App Router support. Handles sessions, email/password, TOTP 2FA via plugin. No external service dependency.

Rules:

Email + password as primary.

TOTP 2FA mandatory for owner role. Optional for clerks.

Password requirements: min 12 chars, must contain letter + number. Owner can reset clerk passwords.

Session JWT in HttpOnly cookie. Short access token (1h), longer refresh token (30 days).

No social auth (Google etc.) — overkill for two-company internal app.

Hosting: Vercel

Why: Best-in-class for Next.js. Free tier covers current scale. Preview deployments on every branch — great for showing the owner work in progress.

Rules:

One production project. Connected to main branch.

Preview deployments on all other branches.

Environment variables managed via Vercel dashboard, not committed.

UI: shadcn/ui + Tailwind CSS

Why: shadcn gives us copy-pasted components we own (no opaque dependency). Tailwind for layout and customisation. Both well-supported by AI tooling.

Rules:

Use shadcn components as the baseline. Customise colors via CSS variables.

Avoid building custom components when a shadcn one fits.

Mobile-first. All screens designed for 375px width minimum. Then desktop layouts.

Accessibility: WCAG 2.1 AA. Especially: keyboard navigation, sufficient color contrast, screen reader labels on all icons.

Data fetching: TanStack Query (client) + RSC fetch (server)

Why: RSC is great for the initial render. TanStack Query is the right tool for client-side caching, optimistic updates, and offline-friendly mutations.

Rules:

Server fetches happen inside Server Components or Server Actions.

Client-side reactive data uses TanStack Query.

Mutations: Server Actions for forms; TanStack Query mutations for client-side interactivity (e.g. inline rating change).

Never useEffect to fetch data on mount. Use TanStack Query.

Forms: React Hook Form + Zod

Why: Best DX, smallest client bundle, native validation, plays well with Server Actions.

Rules:

One Zod schema per form. Server Action re-validates against the same schema (defense in depth).

Schemas live in lib/schemas/ shared between client and server.

Background jobs: Vercel Cron + Route Handlers

Why: Vercel Cron schedules the trigger. The job itself is a Route Handler (both light and heavy work — SQLite runs in-process so no round-trip penalty).

Rules:

All cron jobs declared in vercel.json.

Idempotent — running a job twice produces the same result.

Logs every run with start time, end time, items processed, errors.

Failure of one item doesn't fail the whole batch.

Other libraries

Need

Choice

Notes

Date/time

date-fns + date-fns-tz

Always work in UTC, format in Asia/Kolkata

Currency math

Plain bigint (paise)

No decimal.js. Custom utility wrapper.

Currency display

Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

Phone numbers

libphonenumber-js

Always store as E.164 (+918714578535). Display per locale.

PDF generation (templates)

@react-pdf/renderer (Phase 6)

Document templates library

Excel export

exceljs

Reports, customer export

Charts

recharts

Dashboard, reports

i18n

next-intl

English + Malayalam

Testing

vitest (logic) + playwright (E2E)

Linting

ESLint strict + Prettier

Email

resend

Owner notifications only

## 5. Multi-tenancy

Both companies (Jeevana and Phenix) run on the same database, same code, same deployment. Isolation is enforced by `company_id` on every business row and application-level authorization checks in every Server Action.

### How it works

Every domain table has a company_id uuid not null column.

RLS policy: auth.uid() resolves to a user; user has a company_membership granting them a role within a company; SELECT/INSERT/UPDATE/DELETE policies check this.

Owner has membership in both Jeevana and Phenix. UI exposes a top-bar company switcher; selected company stored in session.

Clerks belong to one company only (typically).

The app stores company_id in the Better Auth session; query helpers explicitly filter on this.

Why not separate databases / schemas

Owner's reports cut across both companies (combined disbursal totals, etc.). Single database makes this trivial.

Operationally simpler: one database to backup, migrate, monitor.

Adding a third company means inserting a row in companies. No infra change.

Adding a branch later

Branches are nested under a company. We'll add a branch_id foreign key (nullable until needed) on customers, loans, payments. Until a company opens a second branch, every row's branch_id is null and reports work as today. When a branch opens, we backfill branch_id on existing data, enforce non-null, and add a branch selector. No architectural change.

## 6. Key architectural decisions

ADR-001: Single-region deployment

Decision: Deploy to a single region (Vercel → Singapore). Context: Users are in Kerala, India. Singapore is ~50ms away. SQLite is embedded in the process so there is no separate database region to consider. Consequences: Acceptable latency. Single point of regional failure (mitigated by daily backups to owner's Google Drive).

ADR-002: Server Components by default

Decision: Use Server Components and Server Actions wherever possible. Context: Minimises client JS, reduces bundle size, simpler data fetching. Consequences: Some interactivity requires explicit Client Components. Forms use Server Actions which are slightly more verbose than client-side mutations but type-safe end to end.

ADR-003: Event-sourced derivations (rating, balance, fines)

Decision: Don't store derived values like current_rating, outstanding_balance, overdue_days. Compute them from event tables (rating_changes, payments, fines). Context: Derived state goes stale. Keeping it correct requires triggers or app code that gets buggy. Computing on read is simple and correct. Consequences: Slightly more query complexity. Use SQLite VIEWs or Drizzle query helpers to encapsulate. Add a `customer_summary` cached table, refreshed by the nightly cron, for dashboard performance. Live data still queries the source tables.

ADR-004: Money as bigint paise

Decision: All currency stored and computed as integer paise. ₹1.00 = 100. Context: Floats are forbidden for money. numeric works but bigint is faster and simpler for our amounts. Max safe bigint is ~9.2 × 10^18 — vastly more than we need. Consequences: Display layer converts to ₹ for users. Utility functions toPaise/toRupees shared across server and client.

ADR-005: Audit log as separate append-only table

Decision: Every state change (loan created, payment recorded, rating changed, customer edited, etc.) writes a row to audit_log. Context: Trust and recovery are core requirements. We need to know who changed what when. Consequences: Slight write overhead. Worth it.

ADR-006: No data import at go-live

Decision: Existing live loans stay outside the system. App handles all new loans from go-live onward. Context: Owner explicit decision. Avoids long, risky data migration. Consequences: Reports won't show pre-launch loans. For ~100 days (max DP tenure), there'll be a "mixed" period. Documented.

ADR-007: Rating engine as suggestions, not hard automation

Decision: Most rating rules generate suggestions for owner review. Only severe rules (loan write-off, recovery state transitions) auto-apply. Context: Owner explicit decision — external factors (industry trouble, customer life events) affect behavior. Pure automation produces wrong ratings. Consequences: A rating_suggestions table. Owner dashboard has a "pending suggestions" widget. See business-rules.md (see Business Rules) § 6.

ADR-008: Offline mode deferred to Phase 7

Decision: Phase 1–6 require connectivity. Phase 7 adds offline support using TanStack Query mutation persistence + IndexedDB. Context: Offline-first is genuinely hard. Doing it from day one slows everything else. Better to ship online-first and add offline once the data model is stable. Consequences: Until Phase 7, the app needs network. Acceptable for Kerala office connectivity.

ADR-009: WhatsApp via tap-to-send links (free), not paid API

Decision: Use wa.me/<phone>?text=<message> deep links. Staff taps once per recipient. Context: Owner explicit choice. Avoids ₹0.30–0.80 per message cost. Consequences: Bulk campaigns require staff to tap through multiple sends. UI batches this efficiently. Optional SMS fallback (Phase 6) for messages where WhatsApp delivery is critical.

ADR-010: Indian Rupee paise as the only currency

Decision: No currency abstraction. Everything is INR. Context: Both companies operate only in India. Consequences: Trivially simpler. If a future company is non-INR, we revisit then.

## 7. Module structure

Directory layout (Next.js App Router):

loan-manager/├── app/│   ├── (auth)/                # Public routes: /login, /forgot-password│   ├── (app)/                 # Authenticated routes│   │   ├── layout.tsx         # Sidebar, top-bar company switcher│   │   ├── dashboard/│   │   ├── customers/│   │   │   ├── page.tsx       # List│   │   │   ├── new/│   │   │   └── [dcs]/         # Detail view│   │   ├── loans/│   │   │   ├── new/│   │   │   └── [id]/│   │   ├── payments/│   │   ├── reports/│   │   ├── messages/          # Reminders, campaigns│   │   ├── settings/│   │   └── admin/             # Owner-only: roles, audit log│   └── api/                   # Route handlers (cron, exports, Better Auth handler)├── components/│   ├── ui/                    # shadcn components│   ├── domain/                # Business components (RatingBadge, LoanCard, etc.)│   └── layout/                # AppShell, Sidebar, CompanySwitcher├── lib/│   ├── db/                    # Drizzle client, query helpers│   ├── auth.ts                # Better Auth instance│   ├── auth-client.ts         # Better Auth client (client components)│   ├── schemas/               # Zod schemas│   ├── domain/                # Business logic (interest, fines, rating)│   │   ├── interest.ts│   │   ├── fines.ts│   │   ├── rating.ts│   │   ├── eligibility.ts│   │   └── recovery.ts│   ├── i18n/│   ├── audit/│   └── utils/├── drizzle/│   ├── migrations/            # SQL migrations (Drizzle Kit generated)│   ├── schema.ts              # Drizzle schema definition│   └── seed.ts                # Seed data├── tests/│   ├── e2e/                   # Playwright│   └── unit/                  # Vitest (logic in lib/domain)├── public/├── docs/                      # This documentation├── CLAUDE.md├── package.json└── vercel.json

Key rule: domain logic lives in lib/domain/

All business rules (interest calculation, fine engine, rating logic, eligibility checks, recovery transitions) are pure TypeScript functions in lib/domain/. No database access, no UI imports. Just functions that take typed inputs and return typed outputs.

This makes them:

Testable — unit-test with Vitest, no test DB needed.

Reusable — same function called by Server Action, by cron job, by edge function.

Auditable — one place to look for "how do we calculate WB fines."

Server Actions and cron jobs orchestrate these functions, persist results to DB, write audit log entries. No business logic in the route handlers themselves.

## 8. Non-functional requirements

Performance

Initial page load on slow 4G (1.5 Mbps): < 3s to interactive.

Subsequent navigation: < 1s.

DCS lookup: < 500ms from query to results.

Payment recording: < 1s for the optimistic UI update; < 2s for DB commit confirmation.

Reliability

Uptime: Best-effort 99.5% (Vercel SLA — for a small business app this is fine).

Backup: Daily copy of the SQLite database file to owner's Google Drive via cron. Weekly Excel exports of all tables.

Recovery time objective: 4 hours from incident to functional restore.

Recovery point objective: 24 hours (worst case, you lose a day of data — acceptable for this app).

Security

All traffic over HTTPS (Vercel enforces).

Database access only via Drizzle ORM in Server Components, Server Actions, or Route Handlers. Never from client components.

Authorization enforced in application code — every Server Action checks company membership before data access.

2FA mandatory for owner.

Secrets in Vercel environment variables, never in code.

No PII in logs. Log structure reviewed for accidental leaks.

File uploads stored under `/uploads/<company_id>/` and served only to authenticated users of that company.

Privacy

Customer data never leaves the database except for legitimate business use.

No analytics tracking on customer-identifying behavior.

No third-party scripts on customer-facing pages (none exist anyway).

Excel exports require owner role; logged in audit trail.

Internationalisation

English + Malayalam at launch.

All UI strings localised via next-intl.

Customer messages use the customer's preferred language.

Owner/clerk can switch language at any time; persists per-user.

Compatibility

Browser baseline: iOS Safari 16+, Android Chrome 110+, Desktop Chrome/Edge/Safari/Firefox last 2 versions.

Min viewport: 375px.

Installable as PWA (manifest + service worker).

Observability

Errors → Sentry, with user role and company context.

Performance → Vercel Analytics.

Audit trail → `audit_log` table in SQLite (queryable by owner).

## 9. Authentication & authorization flow

[ Sequence Diagram — renders natively in the GitHub repo / Markdown viewer ]

sequenceDiagram    actor U as User (Clerk/Owner)    participant App as Next.js App    participant BA as Better Auth    participant DB as SQLite (Drizzle)    U->>App: Visit /login    App-->>U: Render login page    U->>App: Submit email + password    App->>BA: auth.api.signInWithEmail()    alt 2FA required        BA-->>App: MFA challenge        App-->>U: Prompt for TOTP code        U->>App: Submit TOTP code        App->>BA: auth.api.verifyTotp()    end    BA-->>App: Session cookie    App->>DB: Fetch user's company memberships    DB-->>App: [Jeevana role, Phenix role] (for owner)    App-->>U: Redirect to dashboard with default company selected    Note over U,DB: Subsequent requests    U->>App: Visit /customers    App->>DB: SELECT FROM customers WHERE company_id = $current_company    DB->>App: App code verifies user has membership in $current_company    DB-->>App: Rows for that company    App-->>U: Render customer list

## 10. Key data flows

Recording a payment

[ Sequence Diagram — renders natively in the GitHub repo / Markdown viewer ]

sequenceDiagram    actor Clerk    participant UI as Client Component    participant SA as Server Action    participant DB as SQLite (Drizzle)    participant Domain as lib/domain/*    participant WA as wa.me    Clerk->>UI: Open customer DCS lookup    UI->>SA: getCustomerWithLoans(dcs)    SA->>DB: SELECT customer, active loans    DB-->>SA: Data    SA-->>UI: Render    Clerk->>UI: Click "Record payment", fill form    UI->>SA: recordPayment({loanId, amount, ref})    SA->>Domain: validatePayment(loan, amount)    Domain-->>SA: OK    SA->>DB: BEGIN TX    SA->>DB: INSERT into payments    SA->>DB: INSERT into audit_log    SA->>Domain: computeRatingSuggestions(customer, payments, fines)    alt Suggestion fires        SA->>DB: INSERT into rating_suggestions    end    SA->>DB: COMMIT    SA-->>UI: { success: true, newBalance }    UI->>UI: Update optimistic state    UI->>WA: Open wa.me link with pre-filled confirmation    Clerk->>WA: Tap send

Daily fine + rating recompute (cron)

[ Flow Diagram — renders natively in the GitHub repo / Markdown viewer ]

flowchart LR  Cron["Vercel Cron<br/>(daily 06:00 IST)"]  Fn["Edge Function:<br/>nightly-recompute"]  Loans[("loans + payments")]  Domain["lib/domain/fines.ts"]  Fines[("fines")]  Audit[("audit_log")]  Sug[("rating_suggestions")]  Notif["Owner notification<br/>(email + in-app)"]  Cron --> Fn  Fn --> Loans  Fn --> Domain  Domain --> Fines  Domain --> Sug  Fn --> Audit  Fn --> Notif

## 11. Background jobs

Job

Schedule

What it does

nightly-recompute

Daily 06:00 IST

For every active loan: detect new fines per rules, generate rating suggestions, flag rating changes, flag renewal eligibility

daily-reminder-prep

Daily 08:00 IST

For every defaulted loan within reminder rules: prepare tap-to-send reminder entries in the reminders queue

weekly-backup

Weekly Sunday 02:00 IST

Export all owner's data to a Google Drive folder via the Drive API

monthly-summary

Monthly 1st 06:00 IST

Generate prior month's P&L and email to owner

cleanup-recycle-bin

Daily 04:00 IST

Permanently delete records that have been in recycle bin > 30 days

All jobs:

Idempotent.

Logged: start, end, items processed, errors.

Failures alert owner via email.

## 12. Frontend patterns

Layout

App shell with a left sidebar (collapsible on mobile) and a top bar with the company switcher and user menu.

Persistent navigation on tablet/desktop. Bottom navigation bar on mobile (Dashboard, Customers, Payments, Reports, More).

Forms

React Hook Form + Zod. One schema per form.

Server Action submission. Optimistic updates where safe.

Errors surfaced inline. Submit button disabled while pending.

Data display

shadcn Table with sorting, filtering, pagination. Custom rendering for rating badges, currency, dates.

Empty states are real components — don't show "No data" without explaining how to add the first one.

Loading states use skeletons, not spinners, for content > 200ms.

Currency display utility

// lib/utils/currency.tsexport const formatINR = (paise: bigint): string => {  const rupees = Number(paise) / 100;  return new Intl.NumberFormat('en-IN', {    style: 'currency',    currency: 'INR',    maximumFractionDigits: 0,  }).format(rupees);};

Rating badge component

Single component used everywhere. Reads from a customer_summary view that returns the current rating, lock status, and a tooltip with the last change.

## 13. Code quality and conventions

TypeScript

Strict mode on.

No any (use unknown if you must).

No @ts-ignore (use @ts-expect-error with a comment).

No as casting outside boundary code (parsing, raw DB rows).

Prefer type for unions, interface for object shapes.

Naming

Files: kebab-case (customer-card.tsx).

Components: PascalCase (CustomerCard).

Variables, functions: camelCase.

Database: snake_case for tables and columns.

Constants: SCREAMING_SNAKE_CASE.

Enum-like string unions over enums.

Imports

Absolute imports via @/ alias.

Order: external → internal → relative → types.

No barrel files (index.ts re-exports). Each file imports directly.

Database access

All DB access goes through lib/db/.

Server Components and Server Actions use the Drizzle client (server-only, imported from `lib/db/`).

Client Components never access the database directly. They use Better Auth client (`lib/auth-client.ts`) only for session reads.

Error handling

Server Actions return { success: true, data } | { success: false, error } — never throw across the network boundary.

Throw inside Server Components → captured by error boundary.

Log every error to Sentry with full context (no PII).

Git workflow

main is production. Always deployable.

Feature branches off main. PRs back to main.

Commit messages: conventional commits (feat:, fix:, refactor:, etc.).

Squash-merge to main.

Testing

Domain logic in lib/domain/: 100% unit-tested with Vitest. Pure functions, exhaustive cases.

Critical user paths: Playwright E2E. Login, create customer, create loan, record payment, generate report.

No snapshot tests. No test-for-test's-sake unit tests on UI components.

Run all tests in CI before merge.

## 14. CI/CD

GitHub repo (private).

GitHub Actions runs on every PR: lint, typecheck, unit tests, build.

Vercel auto-deploys: every PR → preview URL; main → production.

Database migrations applied via Drizzle Kit (`npx drizzle-kit migrate`) in CI before deploy.

## 15. Open architectural questions

These are decisions the developer can make once they're in the code. Documented here so they aren't forgotten.

Search: Phase 2 needs DCS / phone / name search. SQLite FTS5 virtual tables are sufficient at our scale. If we hit limits, consider Meilisearch later. Default: SQLite FTS5.

PDF generation: Phase 6 generates printable documents from templates. @react-pdf/renderer is the default. If we need fancier layouts, consider serverless Puppeteer.

Notification queue: Phase 6 reminders. Start with a simple notification_queue table polled by a cron job. Move to a real queue (e.g., Inngest) only if we hit volume issues.

Real-time updates: Use TanStack Query refetch-on-focus for clerks seeing live payment entries. Phase 5 nice-to-have. No Realtime infrastructure needed.

Rate limiting: Vercel has basic rate limiting. Probably enough. Revisit if abuse becomes a concern.

## 16. Things explicitly out of scope architecturally

No microservices.

No event bus.

No service mesh.

No custom design system.

No GraphQL.

No mobile native code.

No on-premise option.

No multi-tenant white-labelling beyond Jeevana + Phenix.

If a future requirement seems to need any of these, treat it as a sign that requirement should be questioned.
