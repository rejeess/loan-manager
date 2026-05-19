# Build Plan

Phased delivery plan for Loan Manager. Each phase delivers a usable slice; the owner can use the app productively after every phase.

This plan assumes one developer working part-time (evenings + weekends, ~15 hours/week). Total ~12 weeks of part-time work, deployable to production after Phase 3 (week 6) for early use.

Overview

Phase

Name

Effort

Cumulative

### Outcome

0

Project setup

1 weekend

1 weekend

Repo, Vercel, Supabase, CI live with empty app

1

Foundation

1 weekend

2 weekends

Auth, companies, users, sidebar, company switcher

2

Customers + DCS + ratings

2 weekends

4 weekends

Add customers, DCS lookup, manual rating system, audit trail

3

Loans + payments

3 weekends

7 weekends

Issue all four loan products, record payments, balances live

4

Fines, eligibility, rating engine

2 weekends

9 weekends

Fine engine per product, eligibility tracking, rating suggestions

5

Reports + long-pending tracker

1.5 weekends

10.5 weekends

Dashboard, daily/weekly/monthly reports, tracker, Excel export

6

Reminders + messages + campaigns

1.5 weekends

12 weekends

Tap-to-send reminders, festival greetings, marketing campaigns

7

Polish + go-live

1 weekend

13 weekends

2FA, offline mode, language toggle, mobile polish, training

Total: ~13 weekends (3 months part-time).

After Phase 3 the app is genuinely usable. After Phase 5 it's the day-to-day tool. Phase 6–7 are enhancements.

## Phase 0 — Project setup

Outcome: Empty Next.js app deployed to production. Local dev environment working. Repo, CI, monitoring live.

### Tasks

Create GitHub repo loan-manager (private).

Bootstrap: pnpm create next-app@latest loan-manager --typescript --tailwind --app --src-dir --use-pnpm.

Install shadcn/ui base components: pnpm dlx shadcn@latest init and add button, input, form, table, dialog, select, dropdown-menu, card, badge, tabs.

Configure ESLint strict, Prettier, TypeScript strict.

Create Supabase project (Singapore region). Save URL + anon key.

Connect repo to Vercel. Set env vars. Deploy main.

Install Supabase CLI locally. supabase init. supabase start works locally.

Set up GitHub Actions: lint + typecheck + build on every PR.

Set up Sentry. Add to error boundary.

Create CLAUDE.md in repo root (template provided separately).

Create docs/ folder; commit all the spec docs.

Set up Playwright for E2E. Smoke test: / returns 200.

### Definition of Done

☐ Production URL serves a placeholder "Loan Manager" page.

☐ Localhost runs the app and local Supabase together.

☐ PR opens a preview deployment.

☐ CI passes lint, typecheck, build.

☐ Sentry receives a test error.

☐ All spec docs in /docs on main.

## Phase 1 — Foundation

Outcome: Owner and clerk can log in. Owner can switch between Jeevana and Phenix. Sidebar navigation works. Empty dashboard shows.

### Tasks

1.1 Database — base tables

Migrations:

companies (seeded with Jeevana, Phenix)

users

company_memberships

audit_log

Helper functions: current_user_company_ids(), current_user_role()

RLS policies on the above.

1.2 Auth flows

/login page (email + password).

2FA setup flow for owners (TOTP, stored in Supabase Auth).

2FA challenge on login when configured.

/forgot-password flow.

Middleware redirecting unauthenticated users to login.

Server Actions: signIn, verifyMfa, signOut.

1.3 Layout shell

App shell with left sidebar (collapsible on mobile).

Top bar with company switcher (visible only if user has membership in multiple companies — i.e. only owner).

User menu (profile, language, sign out).

Bottom navigation on mobile.

Empty placeholder pages for: Dashboard, Customers, Loans, Payments, Reports, Messages, Settings.

1.4 Company management

Owner-only /settings/company page.

Form to edit company details (legal name, address, phone, license, T&Cs, logo).

Logo upload to Supabase Storage.

1.5 User management

Owner-only /admin/users page.

List of users + memberships.

Invite clerk (form: email, full name, company). Sends Supabase Auth invite.

Deactivate / reactivate clerk.

1.6 Audit log viewer

Owner-only /admin/audit-log page.

Filterable table of audit log entries.

### Definition of Done

☐ Two seed users exist: owner (with both memberships) and clerk-jeevana.

☐ Owner logs in, sees both companies in switcher.

☐ Clerk logs in, sees only their assigned company.

☐ Owner can switch companies; UI updates correctly.

☐ Owner can edit company details and upload logos.

☐ Owner can invite a new clerk; email is received.

☐ Audit log records the company-switch and any setting changes.

☐ 2FA setup works for owner; can't bypass it on login.

☐ Mobile layout is usable (375px wide).

☐ All Playwright E2E tests pass for: login, login with 2FA, switch company, invite clerk.

## Phase 2 — Customers, DCS lookup, ratings (manual)

Outcome: Owner and clerk can register customers, look them up by DCS / name / phone, and set/change their rating with notes. Audit trail covers all changes. Auto-rating rules NOT yet implemented (Phase 4).

### Tasks

2.1 Database

Migrations for:

customers

rating_changes

rating_suggestions (table exists; not yet populated)

recovery_state_changes (table exists; default state inferred as healthy)

customer_notes

customer_summary materialized view + refresh function

Indexes (text search, phone lookup, DCS)

RLS policies

2.2 DCS auto-numbering

Advisory lock implementation in lib/db/dcs.ts.

Atomic increment of companies.dcs_next_number within transaction.

2.3 Rating badge component

<RatingBadge customer={customer} /> — colour pill with tier label, lock icon if locked, click to open history dialog.

Used in 8+ places (customer list, detail, loan card, payment recording, dashboard, etc.).

2.4 Customer registration

/customers/new page with form.

React Hook Form + Zod schema.

Optional photo upload.

Initial rating selector (defaults to Average).

Initial rating note field (optional but recommended).

Server Action createCustomer.

On submit, redirect to customer detail.

2.5 Customer list

/customers page.

Search bar (DCS / name / last 4 phone).

Filters: rating tier, recovery state, area.

Pagination.

Rows show: rating badge, DCS, name, phone, active loans count.

2.6 Customer detail

/customers/[dcs] page.

Header: rating badge, name, DCS, recovery state badge.

Tabs: Loans (empty for now), Payments (empty), Notes, Rating History, Audit.

Rating change button (changeRating action) with note dialog.

Rating lock toggle (setRatingLock action).

Add note button.

Edit customer details button.

2.7 Rating change history

Tap rating badge → modal showing every rating change with timestamp, source, who, note.

### Definition of Done

☐ Owner registers a new customer; DCS auto-generated (DCS111 for Jeevana, DCS1239 for Phenix).

☐ Clerk registers customers; can set initial rating.

☐ Searching by partial DCS, name, last-4-phone all work.

☐ Rating badge appears everywhere it should.

☐ Rating change requires a note; blank note rejected.

☐ Clerk rating change triggers owner notification (in-app for now; email in Phase 6).

☐ Locking a rating works; locked badge shows.

☐ Audit log records every customer create/update and every rating change.

☐ Customer detail page loads in < 500ms on production.

☐ All E2E tests for customer flows pass.

## Phase 3 — Loans + payments

Outcome: Both companies can issue all four products and record payments. Outstanding balances compute live. Convert and top-up workflows work.

This is the biggest phase. Break it into product-by-product slices.

### Tasks

3.1 Domain library — disbursal math

lib/domain/disbursal.ts:

computeJeevanaDpDisbursal(amount) → DisbursalBreakdown

computePhenixDpDisbursal(amount) → DisbursalBreakdown

computeWbDisbursal(units, unitFraction) → DisbursalBreakdown

computeJeevanaDbDisbursal(amount) → DisbursalBreakdown

computePhenixElDisbursal(amount) → DisbursalBreakdown

100% Vitest unit-tested. Edge cases: smallest/largest amounts per product, half-unit/quarter-unit WB.

3.2 Domain library — balance computation

lib/domain/balance.ts:

computeLoanBalance(loan, payments, fines, asOf) → LoanBalance

One implementation per product variant.

Vitest unit-tested.

3.3 Database

Migrations:

loans (with all product fields)

payments

fines (table exists; not yet populated — Phase 4)

loan_state_changes

notification_queue (table exists; not yet sending — Phase 6)

CHECK constraints (paper + cash = amount for DP, etc.)

Indexes

RLS policies

3.4 Loan creation — Phenix DP first

Build the simplest first.

/loans/new?customer=<dcs> page.

Product selector (filtered by current company).

Amount input.

Live preview of disbursal breakdown.

Override mode for cash component / paper amount (with owner role check).

Rating-gated approval: Risky/Defaulter shows warning + requires note.

Server Action createLoan with full domain logic.

After create: redirect to loan detail.

3.5 Loan creation — Jeevana DP

Extension. Same flow, different math.

3.6 Loan creation — WB (both companies)

Unit count picker. Half-unit/quarter-unit option.

3.7 Loan creation — DB (Jeevana)

Strict amount picker (50K / 75K / 1L / 2L only).

3.8 Loan creation — EL (Phenix)

Free amount up to ₹1,20,000.

3.9 Loan detail page

/loans/[id] page.

Header: customer, product, amount, status.

Balance card: outstanding, arrears, days in arrears.

Payment history table.

Fines list (empty for now).

State changes log.

Actions: Record Payment, Close Loan (owner), Convert to WB (DP only, owner), Phenix Top-up (Phenix DP at 40 instalments, owner).

3.10 Payment recording

Modal opened from loan detail.

Fields: amount (paise → display in ₹), date (default today), method, reference number (required), note.

Server Action recordPayment.

On success: update balance display, queue confirmation message (not sent yet, just queued).

3.11 Close loan flow

Owner-only modal.

Choose closed or written_off.

Note required.

Server Action closeLoan.

3.12 DP → WB conversion

Owner-only modal from DP loan detail.

Shows DP outstanding.

Owner picks WB unit count.

Confirmation.

Server Action convertDpToWb (atomic transaction).

3.13 Phenix top-up

Owner-only button visible when Phenix DP has ≥ 40 paid instalments.

Modal shows old outstanding, new disbursal preview, cash to customer.

Server Action phenixTopUp.

### Definition of Done

☐ All four products can be created; disbursal math matches spec.

☐ Payment recording is two taps from customer search.

☐ Reference number is required (UPI / bank txn ID).

☐ Balance updates after every payment.

☐ Mobile UX is fast (< 1s page transition).

☐ Rating-gated approval works: Risky customer can't create loan without override.

☐ DP→WB conversion atomically closes old, opens new.

☐ Phenix top-up calculates cash to customer correctly.

☐ Domain layer 100% unit-tested.

☐ E2E: create customer → create DP → record 10 payments → close. For each product variant.

This is the milestone to demo to the owner. They can start using the app for real loans after this phase.

## Phase 4 — Fines, eligibility, rating engine

Outcome: System auto-imposes fines per product rules. Tracks eligibility for renewals and progressions. Generates rating suggestions for owner review.

### Tasks

4.1 Domain library — fines

lib/domain/fines.ts:

computeNewFinesForLoan(loan, payments, existingFines, asOf) → Fine[]

Per-product implementations (DP, WB, DB, EL).

Idempotent.

Exhaustively unit-tested.

4.2 Domain library — eligibility

lib/domain/eligibility.ts:

getJeevanaDpEligibility(customer, loans, payments) → EligibilityResult

getPhenixDpEligibility(customer, loans, payments) → EligibilityResult

Returns: { eligibleForNew: boolean; reasons: string[]; nextEligibleAt?: Date; suggestedAmount?: bigint }

4.3 Domain library — rating engine

lib/domain/rating.ts:

computeRatingChanges(customer, loans, payments, fines, ratingHistory, recoveryState) → { autoApply: AutoRating[]; suggestions: Suggestion[] }

Auto-apply rules and suggestion rules per spec.

Idempotent.

Unit-tested.

4.4 Domain library — recovery state

lib/domain/recovery.ts:

computeRecoveryState(customer, loans, payments, fines, currentState) → RecoveryState

Auto-transitions per state machine.

Manual transitions (owner only) live in Server Actions.

4.5 Nightly cron job

app/api/cron/nightly-recompute/route.ts:

Auth: cron secret.

For each active loan: compute new fines, persist.

For each customer: compute rating changes (auto-apply + suggestions).

Update recovery states.

Auto-dismiss stale suggestions.

Log job metrics.

4.6 Pending suggestions UI

Dashboard widget: "X pending rating suggestions".

Click → /dashboard/suggestions page listing all pending.

Each card: customer, current rating, suggested rating, rule reason, [Accept] [Dismiss with note].

Bulk accept option for routine suggestions.

Server Actions acceptRatingSuggestion, dismissRatingSuggestion.

4.7 Recovery state UI

Customer detail shows current recovery state badge.

Owner-only button to change state (with confirmation + note).

Server Action changeRecoveryState.

4.8 Recovery activity log

For customers in recovery or legal state: a recovery activity log section appears.

Server Action logRecoveryActivity.

Quick-add buttons: "Visited today", "Called", "Sent message", "Meeting scheduled".

4.9 Eligibility flags on dashboard

"Eligible for renewal today" widget on dashboard.

Click → customer with pre-filled renewal form (next ₹5K tier).

### Definition of Done

☐ Cron runs daily; fines appear on overdue loans.

☐ Suggestions appear in dashboard widget.

☐ Owner accepts/dismisses suggestions; rating history shows the change.

☐ Recovery state auto-transitions through Watch / FollowUp / Recovery.

☐ Manual transitions to Legal / WrittenOff work (owner only).

☐ Recovery activities log per customer.

☐ Eligibility flags correct customers.

☐ Domain layer 100% tested with edge cases for each product.

## Phase 5 — Reports + long-pending tracker

Outcome: Dashboards, daily/weekly/monthly reports, long-pending tracker, Excel export. Owner has full visibility into the business.

### Tasks

5.1 Dashboard

Morning view with summary stats (per spec).

Per-company toggle.

Rating distribution chart (Recharts pie).

Today's tasks (eligibility flags, suggestions, defaulters to call).

5.2 Long-pending tracker

/messages/long-pending or /tracker page.

Sortable table.

Quick actions per row: WhatsApp reminder (Phase 6 hook), call (tel:), mark as contacted.

Filters: rating, product, recovery state.

5.3 Reports — disbursal & collection

/reports/disbursal and /reports/collection.

Date range picker.

Charts: trend line, by product breakdown.

Table view with sortable columns.

Export to Excel button.

5.4 Reports — P&L (owner-only)

/reports/pnl page.

Monthly view by default.

Breakdown: interest earned, fines collected, expenses (entry form for expenses), profit estimate.

Year-over-year comparison.

5.5 Reports — yearly GST summary (owner-only)

/reports/yearly page.

Indian financial year (Apr–Mar) selector.

Format: TBD with owner's accountant in Phase 5.

Export to Excel + PDF.

5.6 Reports — rating distribution & trends

/reports/ratings page.

Distribution snapshot.

Trend over time (last 12 months).

Customers who moved up / down by tier.

5.7 Excel exports

lib/exports/excel.ts:

One function per entity using exceljs.

Upload to Supabase Storage, return signed URL.

Audit-logged.

### Definition of Done

☐ Dashboard loads in < 1s on production.

☐ All reports filter by company; "both companies" combined view for owner.

☐ Clerk cannot access P&L or yearly summary (RLS-enforced).

☐ Excel exports work for all entity types.

☐ Long-pending tracker is the operational tool for daily collections.

## Phase 6 — Reminders, messages, campaigns

Outcome: Customer messaging works end to end. Reminders queued daily, staff taps to send. Festival greetings, payment confirmations, campaigns.

### Tasks

6.1 Message template system

lib/messaging/templates.ts.

Templates per type per language.

Variable interpolation: {{customerName}}, {{amountDue}}, {{loanId}}, {{daysOverdue}}, etc.

Settings page where owner can edit templates.

6.2 Daily reminder cron

app/api/cron/daily-reminder-prep/route.ts:

For each active loan needing reminder per business rules.

Insert notification_queue row.

Render message in customer's preferred language.

6.3 Reminders UI

/messages/reminders page.

List of queued reminders today.

Per-row: customer info, message preview, [Send] button.

Send opens wa.me/<phone>?text=... in new tab.

On click "Sent" or after returning to app, marks the row.

Bulk send mode.

6.4 Payment confirmation messages

Automatic queueing on payment record (already done in Phase 3 — just wire up the send button on payment success).

6.5 Festival greetings

Configurable holiday calendar (Onam, Vishu, Eid, Christmas).

Owner-only campaign-style sender.

Branded image generated on the fly using Vercel OG image API (Next.js native).

6.6 Birthday / anniversary auto-flagging

Daily cron checks customers.dob (added in Phase 6 migration).

Flags on dashboard for owner to send personally.

6.7 Welcome messages

Owner-triggered manually after loan disbursal (button on loan detail).

6.8 Marketing campaigns

/messages/campaigns/new page.

Form: message templates (en + ml), filters.

Preview button: shows matching count, breakdown.

Server Actions createCampaign, approveCampaign.

Campaign detail page: list of recipients, send-through UI.

6.9 KYC + CIBIL integration (optional Phase 6 — can defer)

Edge functions wrapping the chosen API providers.

Integration into customer registration and loan creation flows.

6.10 Online payment collection via UPI link (deferred to Phase 6.5)

UPI deep link generation: upi://pay?pa=<vpa>&pn=<name>&am=<amount>&tn=<note>&cu=INR.

Include in reminder messages.

Webhook handling: bank/PG sends payment confirmation → auto-record payment.

### Definition of Done

☐ Daily reminder cron queues reminders accurately.

☐ Owner / clerk can send reminders in 2 taps.

☐ Festival greeting sends with branded image.

☐ Campaign filtering produces correct recipient lists.

☐ Defaulters not auto-excluded; owner picks per campaign.

## Phase 7 — Polish + go-live

Outcome: App is production-ready. 2FA enforced. Offline mode works. Mobile UX is polished. Owner and clerks trained.

### Tasks

7.1 Offline mode

Service worker via Next PWA plugin.

TanStack Query mutation persistence to IndexedDB.

Background sync when reconnected.

Conflict resolution: last-write-wins with audit notes.

7.2 Test mode

Test mode toggle in settings.

Marks the user's session as test; all writes go to a _test schema (or marked rows).

Clear test data button.

7.3 Delete protection (recycle bin)

Soft delete via deleted_at column.

/admin/recycle-bin page.

Restore and permanent delete buttons.

Cron job purges > 30 days.

7.4 Language toggle polish

Ensure all UI strings localized.

Malayalam font rendering check on Android.

7.5 Mobile UX polish

Re-walk every screen on 375px viewport.

PWA manifest, install prompt.

Bottom navigation finalised.

Touch targets ≥ 44px.

7.6 2FA enforcement

Block owner login without 2FA configured.

Backup codes generation.

7.7 Weekly Google Drive backup

Edge function with Drive API OAuth.

Owner connects their Drive in settings.

First backup runs manually; cron continues.

7.8 Training materials

Two short videos (one English, one Malayalam): "Add a customer & record a payment" + "Sending reminders".

One-page printed cheat sheets for clerks.

7.9 Go-live runbook

Pre-launch checklist.

Launch-day script.

Rollback plan.

### Definition of Done

☐ App works offline; payments queued and synced.

☐ Test mode is usable for clerk training.

☐ Delete protection works end to end.

☐ 2FA mandatory for owner; works on first login.

☐ Weekly backup uploads to owner's Google Drive.

☐ Owner and at least one clerk trained.

☐ Production cutover complete.

Velocity assumptions and risk

15 hours/week of focused development time.

~3 hours/week swallowed by debugging, deploys, doc updates.

Effective: ~12 hours/week building features.

Risks

Domain rules ambiguity surfacing during build — partially mitigated by the spec, but expect 2–3 owner conversations per phase. Budget 1 hour/week for this.

Offline mode being harder than estimated — Phase 7 may slip 1 weekend. Acceptable.

KYC/CIBIL integration friction — third-party APIs are unpredictable. Defer to post-launch if it blocks anything.

Performance issues at scale — likely none at ~150 active loans. Monitor and address only when concrete.

What to cut if running over

If schedule slips:

Defer KYC/CIBIL integrations to post-launch.

Defer Online payment collection (UPI links).

Defer multi-branch readiness (add later when needed).

Defer test mode (offline mode is more important).

Last to cut: offline mode (operationally important in Kerala connectivity).

Never cut: audit log, 2FA, RLS policies, backup. These are non-negotiable for trust.

After launch

Month 1: monitor closely. Daily check-ins with owner. Fix issues fast.

Month 2: observation and small enhancements.

Month 3: post-launch review. What's working, what isn't. Plan next quarter.

Beyond: the app is in steady state. Maintenance + minor enhancements only. Major features (a third company, branches, multi-product offers) considered case by case.
