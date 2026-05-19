# State Management Plan

Loan Manager should not start with a heavy global state framework. Most app data is server state and should be owned by Postgres/Supabase, with small client state for the active working context.

## State Categories

Server state:

- Companies, memberships, customers, loans, payments, ratings, reports, reminders, audit log.
- Source of truth is Supabase Postgres.
- Read initially through Server Components and typed query helpers.
- Use TanStack Query for interactive screens needing refetch, optimistic updates, realtime refresh, or offline mutation persistence later.

Session state:

- Supabase Auth session.
- Current user role and company memberships.
- Resolved on the server whenever possible.

App state:

- Selected company.
- Staff UI language.
- Mobile sidebar state.
- Search filters and table pagination.
- Unsaved form drafts where helpful.

Derived domain state:

- Outstanding balances, overdue days, rating suggestions, fine thresholds, eligibility.
- Compute from event tables, Postgres views, materialized views, or pure functions in `lib/domain/`.
- Do not mirror this as long-lived client global state.

## Recommended Implementation

Use React context for selected company and UI preferences:

- `components/providers/company-provider.tsx`
- `lib/state/company-store.ts`

Use server functions and query helpers for domain data:

- `lib/db/companies.ts`
- `lib/db/customers.ts`
- `lib/db/loans.ts`
- `lib/db/payments.ts`

Add TanStack Query after the Supabase integration reaches customer/payment flows. It is most useful for:

- DCS lookup
- Payment recording optimistic updates
- Long-pending tracker refresh
- Future offline mutation persistence

Avoid Redux/Zustand unless the app develops complex cross-screen client-only workflows that cannot be solved cleanly with context plus TanStack Query.

