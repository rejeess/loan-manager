Loan Manager — Complete Documentation
Product spec, architecture, data model, business rules, API, and build plan
Table of Contents


About this document
This is the complete documentation set for Loan Manager, packaged as a single document for offline reading. Each section below is also available as a standalone document in the repository under docs/.
Read in order:
Product Specification — what we're building
Architecture (HLD) — how the system is designed
Data Model — Postgres schema
Business Rules — domain logic
API Contracts — server actions and endpoints
Build Plan — phased delivery
Glossary — terms reference

Product Specification
Product Specification
Loan Manager — locked product requirements
This document describes what the system does. For how it's built, see architecture-hld.md (see Architecture Hld). For business-rule depth (interest math, fine compounding, rating engine), see business-rules.md (see Business Rules).

1. What we're building
A private web application with progressive web application features, that runs on phone, tablet, or laptop. Used by the owner and clerks of two finance companies in Kerala:
Jeevana Loans
Phenix Money & More (Friends Mall Business Arcade, 2nd Floor, Suite 36/6108, Shornur Road – 680022, +91 8714 57 8535)
The system is multi-company from day one. Owner can switch between Jeevana and Phenix and see each company's loans, customers, and reports separately. No shared customer pool — each company has its own ledger.
Customers do not log in. They receive WhatsApp/SMS messages from the system.
Not in scope
Public access of any kind
Customer money transfers (the app is informational; payments still happen via UPI/bank)
Any government system integrations (GST, KYC reporting, etc.)
Replacing the accountant (but it produces reports they can use)
Native mobile apps (it's a Progressive Web App installable from the website)

2. Users and roles
Owner
Full access to both companies.
All data, all reports, all settings, all overrides.
Approves new loans for Risky/Defaulter rated customers.
Approves marketing campaigns before they go out.
Decides on rating changes flagged by the system.
Manages staff and roles.
Clerks
Add loans, record payments, look up customers.
Set the initial rating when registering a new customer.
Change a customer's rating (mandatory note; owner gets notified, no approval needed).
Can lock/unlock a customer's rating.
Cannot see income/profit data, P&L, yearly summary.
Cannot manage staff, change settings, delete records.
Cannot trigger marketing campaigns.
Customers
Do not log in. No private link.
Receive WhatsApp/SMS messages: payment reminders, payment confirmations, festival greetings, loan-closed messages (no NOC document is generated).
Each customer has a preferred language (English or Malayalam) saved against their record; messages go in that language.

3. Companies and products
Summary
Company
Product
Min – Max
Tenure
Repayment
Jeevana
DP — Daily Pathy
₹25,000 – ₹1,00,000
100 days (day 1 = disbursal day)
100 equal daily instalments
Jeevana
WB — Weekly Block
₹10,000 (¼ unit) – ₹2,40,000 (6 units)
Open-ended (interest-only weekly)
Weekly interest, principal stays
Jeevana
DB — Daily Block
₹50,000 / ₹75,000 / ₹1,00,000 / ₹2,00,000
Open-ended (interest-only daily)
Daily interest, principal stays
Phenix
DP — Daily Pathy
₹5,000 – ₹40,000
50 days (day 1 = day after disbursal)
50 equal daily instalments
Phenix
WB — Weekly Block
Same as Jeevana WB
Same as Jeevana WB
Same as Jeevana WB
Phenix
EL — Emergency Loan
Owner decides, up to ₹1,20,000
Open-ended (interest-only daily)
₹25/day per ₹1,000 borrowed

Full disbursal math, eligibility rules, and fine logic are in business-rules.md (see Business Rules).
Money flow principle
All payments are received via UPI or bank transfer directly to the company account. No physical cash receipts. Every payment recorded in the system has a UPI reference or bank transaction ID.
On disbursal, the system records four numbers honestly: requested amount, paper-disbursed amount, cash component, and total repayable. The audit trail reflects what actually happened on every loan.

4. Customer rating system
Tiers
Tier
Label
Colour
Meaning
5
Excellent
🟢 Green
Long history of paying early or on time. Eligible for any product, max credit limits, premium offers.
4
Good
🟢 Light green
Reliable customer. Occasional small delays, always pays. Eligible for renewals and upsells.
3
Average
🟡 Yellow
New customer or mixed history. Default when a customer is first added.
2
Risky
🟠 Orange
Frequent delays, has been fined, needs watching. New loans require owner approval.
1
Defaulter
🔴 Red
Currently in serious default or has been written off. No new loans without explicit owner override.

How a rating is set
Initial rating — set by owner or clerk when the customer is registered. Defaults to Average if not specified.
System adjustments — most rules generate suggestions the owner accepts/dismisses. Only the most severe rules auto-apply.
Manual changes — owner or clerk can change any rating at any time with a mandatory note. When a clerk changes a rating, the owner is notified (no approval needed).
Auto-applied (no human approval)
Loan written off → Defaulter, locked.
Customer manually moved to Recovery or Legal state → Risky (Recovery) or Defaulter (Legal), locked.
Suggestions (system flags, human decides)
3+ fines in a single loan → suggest Risky.
DP arrears > 10 days → suggest Risky.
WB unpaid > 2 weeks → suggest Risky.
EL unpaid > 7 days → suggest Risky.
Clean DP loan completion → suggest one-tier upgrade.
DP loan paid early → suggest one-tier upgrade.
Maintains Good or higher for 12 months continuously → suggest Excellent.
Locking
Both owner and clerk can lock a customer's rating, freezing it against system auto-adjustment. Either can unlock with a note.
Defaulter recovery
Defaulters who clear all dues do not auto-jump up. They move to Risky, and normal upgrade rules apply from there.
Visibility
Rating badge shows everywhere the customer appears: DCS lookup, loan creation, payment recording, long-pending tracker, dashboards, reports. Tap the badge to see full history (every change, who/what made it, the reason).
Marketing tied to rating
Owner can target campaigns by rating tier, company, product history, and location. System shows preview and recipient breakdown before owner approves. There is no automatic exclusion of Defaulters — owner reviews each campaign and decides who to include. Messages go via tap-to-send WhatsApp.

5. DCS — customer master view
DCS is the customer's master account number. Each company has its own sequence:
Jeevana starts from DCS111 at go-live (DCS110 is the latest currently in use)
Phenix starts from DCS1239 at go-live (DCS1238 is the latest currently in use)
When a clerk or owner enters a DCS, the screen shows:
Customer rating badge (with current state and any locks)
RCL (Rolling Credit Limit) and current balance
DP status: active loans, days completed, days remaining, dues, fines
WB status: units held, weekly interest due, payments pending
DB status (Jeevana) / EL status (Phenix): active blocks, daily interest due
Recovery state (if any)
This is the most-used screen. Must be fast — type DCS, see everything in one glance.

6. Daily operations
Adding a new loan
Fields captured:
Company (Jeevana / Phenix) — pre-filled from current selector
Product (DP / WB / DB / EL) — filtered to products available for the selected company
Customer (looked up by DCS, name, or last 4 of phone) or new customer
For new customers: name, phone, location (area), full address, ID proof reference (Aadhaar/PAN number stored; no document scan)
Loan amount requested
Disbursal breakdown — system pre-fills the standard split (paper amount, cash component, first-day pathy). Owner can override.
Interest rate (default 16% annual, both companies — owner override possible)
Tenure (auto-set by product)
Start date
If the customer is Risky or Defaulter, system requires explicit owner approval. If Excellent, system pre-fills higher credit limits within product caps.
Recording a payment
Pick customer (DCS, name, or last 4 of phone), enter amount, save.
Mandatory: UPI reference or bank transaction ID.
System updates outstanding balance automatically.
Customer gets a WhatsApp/SMS text confirmation: loan ID, amount paid, balance remaining, date. No PDF receipt.
Supports full and partial payments. Owner decides interest accrual on partial payments manually (system records the partial, surfaces the remaining balance).
DP → WB conversion
When a DP customer falls into financial trouble and can't pay, the owner can convert their DP to WB. System closes the DP (note: "converted to WB"), opens a new WB loan with the unpaid DP balance as the WB principal.
Phenix DP top-up
A Phenix DP customer at 40 successful instalments can request a top-up:
Customer requests higher loan amount (typically the next ₹5K tier).
System calculates new loan: amount → standard 20% cash component → paper-disbursed = 80% → minus outstanding from old loan → balance paid to customer.
Old DP closed with note "settled via top-up".
New DP starts with new amount, new tenure, new daily pathy.
Worked example: customer has ₹20K DP with ₹4K outstanding. Requests ₹25K top-up.
New paper-disbursed: ₹20K (₹25K minus 20% cash component of ₹5K)
Old outstanding deducted: ₹16K paid to customer
New daily pathy: ₹500/day for 50 days
Renewals and new eligibility
When a customer becomes eligible (e.g. 50 days on DP1 → DP2 eligible), system flags this on the dashboard. Owner approves and creates the new loan.
For DP renewals, system pre-fills the new daily pathy using the standard formula: every ₹5,000 increase in loan amount = ₹100 increase in daily pathy. ₹20K → ₹400/day, ₹25K → ₹500/day, ₹30K → ₹600/day, etc.

7. Reminders and customer messages
When reminders trigger
Reminders go only after the customer has defaulted. Different rules per product:
DP (both companies): First reminder after 3 days of non-payment. Repeats daily until settled.
EL (Phenix): First reminder after 3 days of non-payment. Repeats daily until settled.
WB (both companies): First reminder the day after a missed weekly interest payment. Repeats daily until settled. (Note: the 1-week grace period applies only to fines, not reminders.)
Window and frequency
Time window: 9 AM to 7 PM IST.
Days: every day, including Sundays and holidays.
Repeats: daily until the customer settles.
Language: each customer's preferred language (English or Malayalam).
Channel: tap-to-send WhatsApp (free). Owner or clerk taps a button per reminder; pre-filled message opens in WhatsApp.
Other customer messages
Payment received confirmation — after each payment.
Loan closed message — no NOC document issued.
Festival greetings — Onam, Vishu, Eid, Christmas — branded image with firm name. Defaulters can be excluded per campaign by owner choice.
Birthday and anniversary wishes — auto-flagged for owner to send manually.
New scheme / promotional offer — owner-only trigger, targeted by rating tier, company, product history, or location.
Welcome message for new customers — owner manually triggers after a loan is first disbursed.
All notification types can be turned on/off in settings.

8. Owner dashboard and reports
Morning dashboard
First screen on app open. Shows:
Total money currently out as loans (per company, then combined)
Yesterday's disbursals and collections
Who is overdue, sorted by days late
Customers with payments due in the next 10 days
Customers eligible for renewal or a new loan today
Customers crossing fine thresholds today
Rating changes overnight — who moved up, who moved down, and why
Pending rating suggestions for owner review
Long-pending tracker
Shows everyone with overdue payments, sorted by days late. For each customer:
Number of installments overdue, broken down per product.
Customer rating badge — high-rated customers in default flagged separately for personal follow-up.
Recovery state (Healthy / Watch / Follow-up / Recovery / Legal / Written off).
Conversation history (when reminders were sent, when staff noted follow-up, what was said).
One tap to send a WhatsApp reminder in the customer's language.
One tap to mark "spoke to them today" with an optional note.
One tap to call (uses tel: link).
Reports (owner-only access)
Daily / weekly / monthly disbursal totals.
Daily / weekly / monthly collection totals.
New customers, loans closed.
Loans by type (DP, WB, DB, EL) with amounts and tenure breakdown.
Profit estimate (interest income minus expenses, if expenses logged).
Monthly P&L statement.
Yearly summary report — formatted for GST submission.
Customer source tracking — referral, walk-in, ad, etc.
Customer rating distribution and trends.
Export everything to Excel anytime.
What clerks cannot see
Profit estimate, P&L, monthly/yearly income reports, total interest income, promotional campaigns, staff management, audit trail, settings.

9. Safety, trust, and data ownership
Two-factor login (2FA) for owner.
Audit trail — every change anyone makes is logged with name, time, before/after, optional note.
Offline mode — app keeps working without internet, syncs when back online. (Phase 7.)
Test mode — sandbox with fake data for training new clerks. Cannot affect real records.
Delete protection — deleted records go to a recycle bin for 30 days. Recoverable. Only owner can permanently delete.
Daily automatic backup. Weekly backup to a Google Drive owned by the owner.
All data lives in a database controlled by the owner's account.
Excel export of any data, anytime.
If the developer ever stops being available, owner keeps the code, the database, and all accounts. Any other developer can take over.
Customer info never shared, sold, or used for anything outside the business.

10. Internationalisation
Both English and Malayalam supported.
Staff choose their language on login; persists across sessions.
Each customer has a preferred language stored; messages go in that language.
All UI strings, message templates, and PDFs (none currently, but in case we add later) localised.

11. Other features confirmed
Customer photo on entry (optional snap when registering).
Quick search by last 4 digits of phone.
Today's appointments — log walk-ins and follow-ups.
Birthday and anniversary auto-flagging.
Festival greetings with branded image.
Renewal reminders flagged 1 week in advance.
Customer source tracking.
Referral tracking — logged as a note on the customer; no automated reward system.
Customer feedback collection after loan closure — optional, not mandatory.
Document templates library — common forms ready to fill and print.
Automated KYC verification — Aadhaar/PAN via API (integration provider TBD at Phase 6).
Credit score check (CIBIL API) before approving — Phase 6.
Online payment collection via UPI link in reminder — Phase 6.
Multi-branch support — designed for, enabled when a branch is added.

12. What is NOT being built
For clarity, the following items from v1 of the spec were explicitly removed during review:
Manager role — replaced by Owner-only override authority.
Documents per loan — no photos of gold/collateral, no Aadhaar/PAN uploads, no signed agreement uploads. Reference fields only.
PDF receipts and PDF agreements — replaced by text-message confirmations.
NOC document on loan closure — closure message only.
Email alerts for daily summaries — in-app dashboard only.
Loan-disbursed confirmation message to customer.
Paid version of fully automatic WhatsApp — tap-to-send only.
Gold rate ticker.
Built-in EMI calculator.
Voice notes per loan.
Customer portal (no read-only private link for customers).
Cash on hand register.
Daily target tracking.
Loan application form for customers (no self-service).
Data import — no migration of existing live loans. Fresh start from go-live.
Gold loans — not offered by either company.

13. Operating constraints
Realistic monthly running cost: ₹0 to ₹100 at current scale. ₹2,000/month at 1,000+ active loans.
No software licences. No app store fees. No per-user fees. Hosted on free tiers of Vercel + Supabase until scale demands an upgrade.
Browser support: Chrome, Safari, Edge on iOS 16+, Android 11+, recent desktop browsers.
Network: must work on slow 4G. Should degrade gracefully to offline mode when connectivity is intermittent.

14. Firm details (for receipts and messages)
Phenix Money & More
Address: Friends Mall Business Arcade, 2nd Floor, Suite No. 36/6108, Shornur Road – 680022
Phone: +91 8714 57 8535
Logo: provided (assets/phenix-logo.png)
Full legal name, license/registration number, T&Cs text: TBD before Phase 6.
Jeevana Loans
Full details: TBD before Phase 6.
These don't block Phase 1–5. Required before Phase 6 (reminders and customer messages with branded content).

Architecture (HLD)
Architecture — High Level Design
This document describes how the system is built. For what it does, see product-spec.md (see Product Spec).
Audience: the developer building the system. Assumes familiarity with Next.js, Postgres, and modern web app patterns.

1. Architecture goals
In priority order:
Correctness of business rules. Money math, fines, eligibility, rating logic must be exact and auditable.
Owner data sovereignty. Owner owns the database, the code, every account. Zero developer lock-in.
Simplicity of operation. One developer should be able to maintain and extend this. Boring stack, well-understood patterns.
Performance for the user. Sub-second page loads on slow 4G. Optimistic UI for common writes.
Forward extensibility. Adding a third company or branch should not require a rewrite.
Non-goals: web-scale traffic, microservices, multi-region, real-time collaborative editing.

2. System context
[ Flow Diagram — renders natively in the GitHub repo / Markdown viewer ]
flowchart LR
  Owner["Owner<br/>(phone / tablet / desktop)"]
  Clerk["Clerk<br/>(phone / tablet)"]
  App["Loan Manager<br/>(Next.js on Vercel)"]
  DB[("Postgres<br/>+ Supabase Storage")]
  WA["WhatsApp<br/>(tap-to-send via wa.me)"]
  Cron["Vercel Cron<br/>(daily / hourly jobs)"]
  Mail["Email provider<br/>(notifications)"]

  Owner -- HTTPS --> App
  Clerk -- HTTPS --> App
  App -- SQL / RLS --> DB
  App -- "wa.me deep links" --> WA
  Cron -- triggers --> App
  App -- "owner notifications" --> Mail
Customers never interact with the app directly. They only receive messages, sent through tap-to-send WhatsApp links the staff trigger.

3. Deployment topology
[ Flow Diagram — renders natively in the GitHub repo / Markdown viewer ]
flowchart TB
  subgraph Vercel
    NextApp["Next.js App<br/>(Server Components,<br/>Route Handlers,<br/>Server Actions)"]
    CronJobs["Vercel Cron<br/>(scheduled functions)"]
  end

  subgraph Supabase
    Postgres[("Postgres<br/>+ Row Level Security")]
    Auth["Supabase Auth"]
    Storage["Supabase Storage<br/>(logos, photos, exports)"]
    EdgeFn["Edge Functions<br/>(heavy compute,<br/>e.g. rating recompute)"]
  end

  subgraph External
    Resend["Resend<br/>(transactional email)"]
    Sentry["Sentry<br/>(error tracking)"]
    GoogleDrive["Owner's Google Drive<br/>(weekly backup)"]
  end

  NextApp --> Postgres
  NextApp --> Auth
  NextApp --> Storage
  NextApp --> Resend
  NextApp --> Sentry
  CronJobs --> NextApp
  CronJobs --> EdgeFn
  EdgeFn --> Postgres
  EdgeFn --> GoogleDrive
Why this topology:
Vercel + Supabase is the modern "managed everything" stack. One developer, near-zero ops.
All compute is serverless. Scales from zero to ~1000 concurrent users with no work.
Database is single-region (Singapore — closest to Kerala). Acceptable latency for this user base.
No Kubernetes, no Docker, no CI/CD platform to manage. Vercel handles deployment from main branch.

4. Tech stack — locked decisions
Framework: Next.js 15 (App Router) + TypeScript
Why: Server Components reduce client JS dramatically (important on slow 4G). Server Actions remove most need for explicit API endpoints. Strong typing end-to-end with TypeScript. Excellent docs and AI training data for productivity.
Rules:
App Router only (no Pages Router).
Server Components by default. Client Components ("use client") only where genuine interactivity is needed (forms, charts, optimistic updates).
TypeScript strict mode. No any. No @ts-ignore. No as casts outside of carefully-justified boundary code.
ESLint with next/core-web-vitals and next/typescript configs, plus a few additions (see § 13).
Database: Postgres on Supabase
Why: Postgres is the right database for everything. Supabase removes infra work, gives us Row Level Security out of the box, and lets the owner own the data (it's just Postgres — can be migrated anywhere).
Rules:
All schema changes via migrations (supabase/migrations/*.sql). Forward-only.
Row Level Security on every table. No exceptions.
Use bigint for money (paise) and any potentially-large counters. Never integer.
Use timestamptz for all times. Never timestamp.
Use text for strings. Never varchar(n) (no practical benefit in Postgres).
Use uuid for primary keys, generated with gen_random_uuid().
Foreign keys always set. ON DELETE set explicitly (almost always RESTRICT for business data; CASCADE only for audit/derived tables).
Auth: Supabase Auth (email + password, plus TOTP 2FA for owner)
Why: Built-in. Integrates with RLS. Owner doesn't need a separate auth service.
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
Background jobs: Vercel Cron + Supabase Edge Functions
Why: Vercel Cron schedules the trigger. The job itself is either a Route Handler (light work) or an Edge Function (heavy work like batch rating recompute).
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


5. Multi-tenancy
Both companies (Jeevana and Phenix) run on the same database, same code, same deployment. Isolation is enforced by company_id on every business row and Postgres Row Level Security.
How it works
Every domain table has a company_id uuid not null column.
RLS policy: auth.uid() resolves to a user; user has a company_membership granting them a role within a company; SELECT/INSERT/UPDATE/DELETE policies check this.
Owner has membership in both Jeevana and Phenix. UI exposes a top-bar company switcher; selected company stored in session.
Clerks belong to one company only (typically).
The app sets a request.company_id context for the session; queries automatically filter on this via RLS.
Why not separate databases / schemas
Owner's reports cut across both companies (combined disbursal totals, etc.). Single database makes this trivial.
Operationally simpler: one database to backup, migrate, monitor.
Adding a third company means inserting a row in companies. No infra change.
Adding a branch later
Branches are nested under a company. We'll add a branch_id foreign key (nullable until needed) on customers, loans, payments. Until a company opens a second branch, every row's branch_id is null and reports work as today. When a branch opens, we backfill branch_id on existing data, enforce non-null, and add a branch selector. No architectural change.

6. Key architectural decisions
ADR-001: Single-region deployment
Decision: Deploy to a single region (Vercel → Singapore, Supabase → Singapore). Context: Users are in Kerala, India. Singapore is ~50ms away. Multi-region adds complexity without user-visible benefit. Consequences: Acceptable latency. Single point of regional failure (mitigated by daily backups to owner's Google Drive).
ADR-002: Server Components by default
Decision: Use Server Components and Server Actions wherever possible. Context: Minimises client JS, reduces bundle size, simpler data fetching. Consequences: Some interactivity requires explicit Client Components. Forms use Server Actions which are slightly more verbose than client-side mutations but type-safe end to end.
ADR-003: Event-sourced derivations (rating, balance, fines)
Decision: Don't store derived values like current_rating, outstanding_balance, overdue_days. Compute them from event tables (rating_changes, payments, fines). Context: Derived state goes stale. Keeping it correct requires triggers or app code that gets buggy. Computing on read is simple and correct. Consequences: Slightly more query complexity. Use Postgres VIEWS to encapsulate. Add a customer_summary materialized view, refreshed every 5 minutes, for the dashboard. Live data still queries the source tables.
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

7. Module structure
Directory layout (Next.js App Router):
loan-manager/
├── app/
│   ├── (auth)/                # Public routes: /login, /forgot-password
│   ├── (app)/                 # Authenticated routes
│   │   ├── layout.tsx         # Sidebar, top-bar company switcher
│   │   ├── dashboard/
│   │   ├── customers/
│   │   │   ├── page.tsx       # List
│   │   │   ├── new/
│   │   │   └── [dcs]/         # Detail view
│   │   ├── loans/
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── payments/
│   │   ├── reports/
│   │   ├── messages/          # Reminders, campaigns
│   │   ├── settings/
│   │   └── admin/             # Owner-only: roles, audit log
│   └── api/                   # Route handlers (cron, webhooks, exports)
├── components/
│   ├── ui/                    # shadcn components
│   ├── domain/                # Business components (RatingBadge, LoanCard, etc.)
│   └── layout/                # AppShell, Sidebar, CompanySwitcher
├── lib/
│   ├── db/                    # Supabase client, query helpers
│   ├── schemas/               # Zod schemas
│   ├── domain/                # Business logic (interest, fines, rating)
│   │   ├── interest.ts
│   │   ├── fines.ts
│   │   ├── rating.ts
│   │   ├── eligibility.ts
│   │   └── recovery.ts
│   ├── i18n/
│   ├── audit/
│   └── utils/
├── supabase/
│   ├── migrations/            # SQL migrations
│   ├── seed.sql
│   └── functions/             # Edge functions
├── tests/
│   ├── e2e/                   # Playwright
│   └── unit/                  # Vitest (logic in lib/domain)
├── public/
├── docs/                      # This documentation
├── CLAUDE.md
├── package.json
└── vercel.json
Key rule: domain logic lives in lib/domain/
All business rules (interest calculation, fine engine, rating logic, eligibility checks, recovery transitions) are pure TypeScript functions in lib/domain/. No database access, no UI imports. Just functions that take typed inputs and return typed outputs.
This makes them:
Testable — unit-test with Vitest, no test DB needed.
Reusable — same function called by Server Action, by cron job, by edge function.
Auditable — one place to look for "how do we calculate WB fines."
Server Actions and cron jobs orchestrate these functions, persist results to DB, write audit log entries. No business logic in the route handlers themselves.

8. Non-functional requirements
Performance
Initial page load on slow 4G (1.5 Mbps): < 3s to interactive.
Subsequent navigation: < 1s.
DCS lookup: < 500ms from query to results.
Payment recording: < 1s for the optimistic UI update; < 2s for DB commit confirmation.
Reliability
Uptime: Best-effort 99.5% (Vercel + Supabase combined SLA — for a small business app this is fine).
Backup: Automatic daily Postgres dump retained 30 days (Supabase). Weekly export of full data to owner's Google Drive (Edge Function).
Recovery time objective: 4 hours from incident to functional restore.
Recovery point objective: 24 hours (worst case, you lose a day of data — acceptable for this app).
Security
All traffic over HTTPS (Vercel enforces).
Database access only via Supabase, never direct.
Row Level Security enforced on every table.
2FA mandatory for owner.
Secrets in Vercel environment variables, never in code.
No PII in logs. Log structure reviewed for accidental leaks.
Supabase Storage objects scoped by company_id in policy.
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
Audit trail → Postgres audit_log table (queryable by owner).

9. Authentication & authorization flow
[ Sequence Diagram — renders natively in the GitHub repo / Markdown viewer ]
sequenceDiagram
    actor U as User (Clerk/Owner)
    participant App as Next.js App
    participant SB as Supabase Auth
    participant DB as Postgres (with RLS)

    U->>App: Visit /login
    App-->>U: Render login page
    U->>App: Submit email + password
    App->>SB: signInWithPassword()
    alt 2FA required
        SB-->>App: MFA challenge
        App-->>U: Prompt for TOTP code
        U->>App: Submit TOTP code
        App->>SB: verifyMfa()
    end
    SB-->>App: Session JWT (in cookie)
    App->>DB: Fetch user's company memberships
    DB-->>App: [Jeevana role, Phenix role] (for owner)
    App-->>U: Redirect to dashboard with default company selected

    Note over U,DB: Subsequent requests
    U->>App: Visit /customers
    App->>DB: SELECT FROM customers WHERE company_id = $current_company
    DB->>DB: RLS check: does auth.uid() have membership in $current_company?
    DB-->>App: Allowed rows only
    App-->>U: Render customer list

10. Key data flows
Recording a payment
[ Sequence Diagram — renders natively in the GitHub repo / Markdown viewer ]
sequenceDiagram
    actor Clerk
    participant UI as Client Component
    participant SA as Server Action
    participant DB as Postgres
    participant Domain as lib/domain/*
    participant WA as wa.me

    Clerk->>UI: Open customer DCS lookup
    UI->>SA: getCustomerWithLoans(dcs)
    SA->>DB: SELECT customer, active loans
    DB-->>SA: Data
    SA-->>UI: Render
    Clerk->>UI: Click "Record payment", fill form
    UI->>SA: recordPayment({loanId, amount, ref})
    SA->>Domain: validatePayment(loan, amount)
    Domain-->>SA: OK
    SA->>DB: BEGIN TX
    SA->>DB: INSERT into payments
    SA->>DB: INSERT into audit_log
    SA->>Domain: computeRatingSuggestions(customer, payments, fines)
    alt Suggestion fires
        SA->>DB: INSERT into rating_suggestions
    end
    SA->>DB: COMMIT
    SA-->>UI: { success: true, newBalance }
    UI->>UI: Update optimistic state
    UI->>WA: Open wa.me link with pre-filled confirmation
    Clerk->>WA: Tap send
Daily fine + rating recompute (cron)
[ Flow Diagram — renders natively in the GitHub repo / Markdown viewer ]
flowchart LR
  Cron["Vercel Cron<br/>(daily 06:00 IST)"]
  Fn["Edge Function:<br/>nightly-recompute"]
  Loans[("loans + payments")]
  Domain["lib/domain/fines.ts"]
  Fines[("fines")]
  Audit[("audit_log")]
  Sug[("rating_suggestions")]
  Notif["Owner notification<br/>(email + in-app)"]

  Cron --> Fn
  Fn --> Loans
  Fn --> Domain
  Domain --> Fines
  Domain --> Sug
  Fn --> Audit
  Fn --> Notif

11. Background jobs
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

12. Frontend patterns
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
// lib/utils/currency.ts
export const formatINR = (paise: bigint): string => {
  const rupees = Number(paise) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
};
Rating badge component
Single component used everywhere. Reads from a customer_summary view that returns the current rating, lock status, and a tooltip with the last change.

13. Code quality and conventions
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
Server Components and Server Actions use the server Supabase client.
Client Components use the browser Supabase client (rarely needed thanks to RSC).
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

14. CI/CD
GitHub repo (private).
GitHub Actions runs on every PR: lint, typecheck, unit tests, build.
Vercel auto-deploys: every PR → preview URL; main → production.
Database migrations applied via Supabase CLI in CI before deploy.

15. Open architectural questions
These are decisions the developer can make once they're in the code. Documented here so they aren't forgotten.
Search: Phase 2 needs DCS / phone / name search. Postgres full-text search (tsvector) is enough at our scale. If we hit limits, consider Meilisearch later. Default: Postgres FTS.
PDF generation: Phase 6 generates printable documents from templates. @react-pdf/renderer is the default. If we need fancier layouts, consider serverless Puppeteer.
Notification queue: Phase 6 reminders. Start with a simple notification_queue table polled by a cron job. Move to a real queue (e.g., Inngest) only if we hit volume issues.
Real-time updates: Supabase Realtime is available. Use it for clerks seeing each other's payment entries live. Phase 5 nice-to-have.
Rate limiting: Vercel has basic rate limiting. Probably enough. Revisit if abuse becomes a concern.

16. Things explicitly out of scope architecturally
No microservices.
No event bus.
No service mesh.
No custom design system.
No GraphQL.
No mobile native code.
No on-premise option.
No multi-tenant white-labelling beyond Jeevana + Phenix.
If a future requirement seems to need any of these, treat it as a sign that requirement should be questioned.

Data Model
Data Model
Full Postgres schema for Loan Manager. Read architecture-hld.md (see Architecture Hld) § 4 first for principles (bigint paise, RLS, audit log, event-sourced derivations).
This document is the authoritative schema reference. Migrations in supabase/migrations/ must match this document. When they diverge, this document is updated in the same PR.

1. Entity-relationship overview
[ Entity-Relationship Diagram — renders natively in the GitHub repo / Markdown viewer ]
erDiagram
  companies ||--o{ company_memberships : "has"
  users ||--o{ company_memberships : "has"
  companies ||--o{ customers : "has"
  customers ||--o{ loans : "takes"
  loans ||--o{ payments : "receives"
  loans ||--o{ fines : "incurs"
  customers ||--o{ rating_changes : "history"
  customers ||--o{ rating_suggestions : "pending"
  customers ||--o{ recovery_state_changes : "history"
  customers ||--o{ customer_notes : "has"
  loans ||--o{ loan_state_changes : "history"
  companies ||--o{ campaigns : "has"
  campaigns ||--o{ campaign_recipients : "has"
  customers ||--o{ campaign_recipients : "appears in"
  companies ||--o{ notification_queue : "has"
  users ||--o{ audit_log : "actor"

  companies {
    uuid id PK
    text name
    text legal_name
    text address
    text phone
    text license_number
    text logo_path
    text terms_text
    bigint dcs_next_number
    timestamptz created_at
  }

  users {
    uuid id PK
    text email
    text full_name
    text preferred_language
    timestamptz created_at
  }

  company_memberships {
    uuid id PK
    uuid user_id FK
    uuid company_id FK
    text role
    boolean active
    timestamptz created_at
  }

  customers {
    uuid id PK
    uuid company_id FK
    text dcs_number
    text name
    text phone_e164
    text area
    text full_address
    text id_proof_type
    text id_proof_number
    text photo_path
    text preferred_language
    text source
    boolean rating_locked
    int initial_rating
    text initial_rating_note
    timestamptz created_at
  }

  loans {
    uuid id PK
    uuid customer_id FK
    uuid company_id FK
    text product
    bigint amount_paise
    bigint paper_amount_paise
    bigint cash_component_paise
    bigint first_pathy_paise
    bigint daily_pathy_paise
    int tenure_days
    int interest_rate_bps
    date start_date
    text status
    uuid renewed_from_loan_id FK
    uuid converted_from_loan_id FK
    timestamptz created_at
  }

  payments {
    uuid id PK
    uuid loan_id FK
    uuid company_id FK
    bigint amount_paise
    date payment_date
    text payment_method
    text reference_number
    text note
    uuid recorded_by FK
    timestamptz created_at
  }

  fines {
    uuid id PK
    uuid loan_id FK
    uuid company_id FK
    bigint amount_paise
    text reason_code
    text reason_detail
    date imposed_date
    bigint cleared_amount_paise
    timestamptz created_at
  }

  rating_changes {
    uuid id PK
    uuid customer_id FK
    uuid company_id FK
    int previous_rating
    int new_rating
    text source
    text rule_code
    uuid changed_by FK
    text note
    boolean locked_after
    timestamptz created_at
  }

  rating_suggestions {
    uuid id PK
    uuid customer_id FK
    uuid company_id FK
    int suggested_rating
    text rule_code
    text reason_detail
    text status
    uuid resolved_by FK
    text resolution_note
    timestamptz created_at
    timestamptz resolved_at
  }

  recovery_state_changes {
    uuid id PK
    uuid customer_id FK
    uuid company_id FK
    text previous_state
    text new_state
    uuid changed_by FK
    text note
    timestamptz created_at
  }

  customer_notes {
    uuid id PK
    uuid customer_id FK
    uuid company_id FK
    text note
    text category
    uuid created_by FK
    timestamptz created_at
  }

  loan_state_changes {
    uuid id PK
    uuid loan_id FK
    text previous_status
    text new_status
    uuid changed_by FK
    text note
    timestamptz created_at
  }

  campaigns {
    uuid id PK
    uuid company_id FK
    text name
    text message_template_en
    text message_template_ml
    jsonb filters
    text status
    uuid created_by FK
    uuid approved_by FK
    timestamptz created_at
    timestamptz approved_at
  }

  campaign_recipients {
    uuid id PK
    uuid campaign_id FK
    uuid customer_id FK
    text status
    timestamptz sent_at
    uuid sent_by FK
  }

  notification_queue {
    uuid id PK
    uuid company_id FK
    uuid customer_id FK
    uuid loan_id FK
    text type
    text payload_en
    text payload_ml
    text status
    timestamptz scheduled_for
    timestamptz sent_at
    uuid sent_by FK
  }

  audit_log {
    uuid id PK
    uuid company_id FK
    uuid actor_id FK
    text actor_role
    text entity_type
    uuid entity_id
    text action
    jsonb before
    jsonb after
    text note
    timestamptz created_at
  }

2. Tables
companies
The two finance companies. Pre-seeded with Jeevana and Phenix.
Column
Type
Constraints
Notes
id
uuid
PK, default gen_random_uuid()


name
text
NOT NULL, unique
Display name: "Jeevana Loans"
legal_name
text


Full legal entity name
address
text




phone
text


E.164 format
license_number
text




logo_path
text


Path in Supabase Storage
terms_text
text


T&Cs text for messages
dcs_next_number
bigint
NOT NULL
Next DCS number to assign. Jeevana starts at 111, Phenix at 1239.
created_at
timestamptz
NOT NULL, default now()



Seed data:
INSERT INTO companies (name, dcs_next_number) VALUES
  ('Jeevana Loans', 111),
  ('Phenix Money & More', 1239);
users
Application users. One row per staff member. Linked to Supabase Auth via shared id.
Column
Type
Constraints
Notes
id
uuid
PK
Matches auth.users.id
email
text
NOT NULL, unique


full_name
text
NOT NULL


preferred_language
text
NOT NULL, default 'en', CHECK in ('en', 'ml')
UI language
created_at
timestamptz
NOT NULL, default now()



company_memberships
Which user has what role in which company. Owner has rows for both companies; clerks typically have one.
Column
Type
Constraints
Notes
id
uuid
PK, default gen_random_uuid()


user_id
uuid
NOT NULL, FK → users.id ON DELETE RESTRICT


company_id
uuid
NOT NULL, FK → companies.id ON DELETE RESTRICT


role
text
NOT NULL, CHECK in ('owner', 'clerk')


active
boolean
NOT NULL, default true
Soft-disable a clerk's access
created_at
timestamptz
NOT NULL, default now()



UNIQUE (user_id, company_id).
customers
Column
Type
Constraints
Notes
id
uuid
PK, default gen_random_uuid()


company_id
uuid
NOT NULL, FK → companies.id ON DELETE RESTRICT


dcs_number
text
NOT NULL
Display: "DCS111". Unique per company.
name
text
NOT NULL


phone_e164
text
NOT NULL
"+918714578535"
area
text


Locality/area name
full_address
text




id_proof_type
text
CHECK in ('aadhaar', 'pan', 'voter', 'driving_license', 'other')


id_proof_number
text


No scan, just number
photo_path
text


Supabase Storage path
preferred_language
text
NOT NULL, default 'ml', CHECK in ('en', 'ml')
Customer's language for messages
source
text


"referral", "walk-in", "ad", etc.
rating_locked
boolean
NOT NULL, default false
If true, auto-rules can't change the rating
initial_rating
int
NOT NULL, default 3, CHECK between 1 and 5
Set at registration. The "current" rating is the latest rating_changes.new_rating.
initial_rating_note
text


Optional note explaining the initial rating
created_at
timestamptz
NOT NULL, default now()



UNIQUE (company_id, dcs_number). INDEX on (company_id, phone_e164) for quick search. INDEX on (company_id, name text_pattern_ops) for name search. INDEX using GIN on to_tsvector('simple', name) for full-text search.
loans
Column
Type
Constraints
Notes
id
uuid
PK, default gen_random_uuid()


customer_id
uuid
NOT NULL, FK → customers.id ON DELETE RESTRICT


company_id
uuid
NOT NULL, FK → companies.id ON DELETE RESTRICT


product
text
NOT NULL, CHECK in ('dp', 'wb', 'db', 'el')


amount_paise
bigint
NOT NULL, CHECK > 0
Requested amount
paper_amount_paise
bigint
NOT NULL
What's on paper / receipt math
cash_component_paise
bigint
NOT NULL, default 0
Non-zero for DP; zero for others
first_pathy_paise
bigint
NOT NULL, default 0
Day-1 pathy for DP, deducted from disbursal
daily_pathy_paise
bigint


For DP only: ₹/day expected
wb_units
int


For WB only: number of units (1 unit = ₹40K, can be ¼/½)
wb_unit_fraction_denominator
int


For WB: 1 (whole), 2 (half), 4 (quarter)
db_daily_interest_paise
bigint


For DB only
el_daily_interest_paise
bigint


For EL only
tenure_days
int


DP: 100 (Jeevana) or 50 (Phenix). NULL for WB/DB/EL (open-ended).
interest_rate_bps
int
NOT NULL, default 1600
16.00% = 1600 basis points
start_date
date
NOT NULL
DP Jeevana day-1 = disbursal date; DP Phenix day-1 = next day
status
text
NOT NULL, default 'active', CHECK in ('active', 'closed', 'written_off', 'converted')


renewed_from_loan_id
uuid
FK → loans.id
If this loan replaces a prior one (Phenix top-up)
converted_from_loan_id
uuid
FK → loans.id
DP-to-WB conversion source
closed_at
timestamptz


Set when status moves to closed/written_off/converted
created_at
timestamptz
NOT NULL, default now()


created_by
uuid
NOT NULL, FK → users.id



INDEX on (customer_id, status). INDEX on (company_id, status, product). INDEX on (company_id, start_date) for date-range reports.
Domain constraint (enforced in code): for product = 'dp', daily_pathy_paise is NOT NULL and tenure_days is NOT NULL. For wb, wb_units is NOT NULL. Etc.
payments
Every payment recorded. Append-only conceptually (correcting a wrong payment = a new offsetting entry, not editing).
Column
Type
Constraints
Notes
id
uuid
PK, default gen_random_uuid()


loan_id
uuid
NOT NULL, FK → loans.id ON DELETE RESTRICT


company_id
uuid
NOT NULL, FK → companies.id ON DELETE RESTRICT
Denormalised for RLS
amount_paise
bigint
NOT NULL
Can be negative for corrections
payment_date
date
NOT NULL
When the customer paid (not when recorded)
payment_method
text
NOT NULL, CHECK in ('upi', 'bank_transfer', 'adjustment')


reference_number
text
NOT NULL
UPI ref or bank txn ID. For 'adjustment', a descriptive code.
note
text


Free text
recorded_by
uuid
NOT NULL, FK → users.id


created_at
timestamptz
NOT NULL, default now()



INDEX on (loan_id, payment_date). INDEX on (company_id, payment_date) for daily/weekly/monthly reports.
fines
Append-only. A fine is "cleared" by cleared_amount_paise being increased over time as payments allocate.
Column
Type
Constraints
Notes
id
uuid
PK, default gen_random_uuid()


loan_id
uuid
NOT NULL, FK → loans.id ON DELETE RESTRICT


company_id
uuid
NOT NULL, FK → companies.id ON DELETE RESTRICT


amount_paise
bigint
NOT NULL, CHECK > 0


reason_code
text
NOT NULL
E.g. dp_4_consecutive_days, wb_compound_week_3
reason_detail
text


Human-readable explanation
imposed_date
date
NOT NULL


cleared_amount_paise
bigint
NOT NULL, default 0
How much of this fine has been cleared by subsequent payments
created_at
timestamptz
NOT NULL, default now()



INDEX on (loan_id, imposed_date).
rating_changes
Every rating change, including the initial set. Append-only. The customer's current rating = the new_rating of the most recent row.
Column
Type
Constraints
Notes
id
uuid
PK, default gen_random_uuid()


customer_id
uuid
NOT NULL, FK → customers.id ON DELETE RESTRICT


company_id
uuid
NOT NULL, FK → companies.id ON DELETE RESTRICT


previous_rating
int
CHECK between 1 and 5
Null for the initial row
new_rating
int
NOT NULL, CHECK between 1 and 5


source
text
NOT NULL, CHECK in ('initial', 'auto_rule', 'manual_owner', 'manual_clerk', 'suggestion_accepted')


rule_code
text


E.g. loan_written_off. NULL for manual.
changed_by
uuid
FK → users.id
NULL for auto
note
text


Required for manual changes
locked_after
boolean
NOT NULL, default false
If this change also set rating_locked = true on the customer
created_at
timestamptz
NOT NULL, default now()



INDEX on (customer_id, created_at DESC) for "latest rating" lookups.
rating_suggestions
Pending suggestions from the rule engine. Owner reviews and accepts/dismisses.
Column
Type
Constraints
Notes
id
uuid
PK, default gen_random_uuid()


customer_id
uuid
NOT NULL, FK → customers.id ON DELETE RESTRICT


company_id
uuid
NOT NULL, FK → companies.id ON DELETE RESTRICT


suggested_rating
int
NOT NULL, CHECK between 1 and 5


rule_code
text
NOT NULL
E.g. dp_arrears_10_days
reason_detail
text
NOT NULL
Human-readable
status
text
NOT NULL, default 'pending', CHECK in ('pending', 'accepted', 'dismissed')


resolved_by
uuid
FK → users.id


resolution_note
text




created_at
timestamptz
NOT NULL, default now()


resolved_at
timestamptz





UNIQUE (customer_id, rule_code, status) WHERE status = 'pending' — prevents duplicates of the same suggestion stacking up.
recovery_state_changes
Column
Type
Constraints
Notes
id
uuid
PK, default gen_random_uuid()


customer_id
uuid
NOT NULL, FK → customers.id ON DELETE RESTRICT


company_id
uuid
NOT NULL, FK → companies.id ON DELETE RESTRICT


previous_state
text
CHECK in valid states (see below)
Null for first row
new_state
text
NOT NULL, CHECK in valid states


changed_by
uuid
FK → users.id
NULL for auto-system transitions
note
text




created_at
timestamptz
NOT NULL, default now()



Valid states: healthy, watch, follow_up, recovery, legal, written_off. See business-rules.md (see Business Rules) § 8.
Current state = latest row's new_state. Default if no rows: healthy.
customer_notes
Free-text notes the staff add over time (NRI son in Dubai, prefers Sunday calls, business is struggling, etc.).
Column
Type
Constraints
Notes
id
uuid
PK


customer_id
uuid
NOT NULL, FK


company_id
uuid
NOT NULL, FK


note
text
NOT NULL


category
text
CHECK in ('general', 'follow_up', 'conversation', 'referral', 'flag')


created_by
uuid
NOT NULL, FK → users.id


created_at
timestamptz
NOT NULL, default now()



loan_state_changes
Loan lifecycle history.
Column
Type
Constraints
Notes
id
uuid
PK


loan_id
uuid
NOT NULL, FK


previous_status
text




new_status
text
NOT NULL


changed_by
uuid
NOT NULL, FK → users.id


note
text




created_at
timestamptz
NOT NULL, default now()



campaigns & campaign_recipients
Marketing campaigns.
campaigns:
Column
Type
Constraints
Notes
id
uuid
PK


company_id
uuid
NOT NULL, FK


name
text
NOT NULL
Internal label
message_template_en
text
NOT NULL
Template with {{name}}, {{amount}}, etc. placeholders
message_template_ml
text
NOT NULL


filters
jsonb
NOT NULL
{ rating: [4,5], product_history: ['wb'], areas: ['Shornur'] }
status
text
NOT NULL, default 'draft', CHECK in ('draft', 'pending_approval', 'approved', 'sending', 'completed', 'cancelled')


created_by
uuid
NOT NULL, FK → users.id


approved_by
uuid
FK → users.id


created_at
timestamptz
NOT NULL, default now()


approved_at
timestamptz





campaign_recipients:
Column
Type
Constraints
Notes
id
uuid
PK


campaign_id
uuid
NOT NULL, FK


customer_id
uuid
NOT NULL, FK


status
text
NOT NULL, default 'pending', CHECK in ('pending', 'sent', 'skipped', 'failed')


sent_at
timestamptz




sent_by
uuid
FK → users.id



UNIQUE (campaign_id, customer_id).
notification_queue
Non-campaign messages: payment confirmations, reminders, festival greetings.
Column
Type
Constraints
Notes
id
uuid
PK


company_id
uuid
NOT NULL, FK


customer_id
uuid
NOT NULL, FK


loan_id
uuid
FK
NULL for festival greetings
type
text
NOT NULL, CHECK in ('payment_confirmation', 'reminder', 'loan_closed', 'festival', 'birthday', 'welcome')


payload_en
text
NOT NULL
Rendered message text
payload_ml
text
NOT NULL


status
text
NOT NULL, default 'queued', CHECK in ('queued', 'sent', 'skipped', 'cancelled')


scheduled_for
timestamptz
NOT NULL


sent_at
timestamptz




sent_by
uuid
FK → users.id



INDEX on (company_id, status, scheduled_for).
audit_log
Universal audit trail. Every write to a domain table writes here.
Column
Type
Constraints
Notes
id
uuid
PK


company_id
uuid
FK
NULL for cross-company actions
actor_id
uuid
FK → users.id
NULL for system actions
actor_role
text


Snapshot of role at time of action
entity_type
text
NOT NULL
customer, loan, payment, rating, campaign, etc.
entity_id
uuid
NOT NULL


action
text
NOT NULL
created, updated, deleted, state_changed, etc.
before
jsonb


Snapshot before the change
after
jsonb


Snapshot after the change
note
text


Optional context
created_at
timestamptz
NOT NULL, default now()



INDEX on (company_id, created_at DESC). INDEX on (entity_type, entity_id, created_at DESC).

3. Views
customer_summary
The DCS lookup screen and customer list use this. Refreshed every 5 minutes (materialised view) for dashboard performance; live components query the underlying tables for accuracy.
CREATE MATERIALIZED VIEW customer_summary AS
SELECT
  c.id AS customer_id,
  c.company_id,
  c.dcs_number,
  c.name,
  c.phone_e164,
  c.area,
  c.preferred_language,
  c.rating_locked,
  -- Current rating
  COALESCE(
    (SELECT new_rating FROM rating_changes
     WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1),
    c.initial_rating
  ) AS current_rating,
  -- Current recovery state
  COALESCE(
    (SELECT new_state FROM recovery_state_changes
     WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1),
    'healthy'
  ) AS recovery_state,
  -- Active loan summary
  (SELECT COUNT(*) FROM loans
   WHERE customer_id = c.id AND status = 'active') AS active_loan_count,
  (SELECT COALESCE(SUM(amount_paise), 0) FROM loans
   WHERE customer_id = c.id AND status = 'active') AS total_active_principal_paise
FROM customers c;
A live (non-materialised) version with the same columns exists for the customer detail view, where staleness is unacceptable.
loan_balance
Computes current outstanding for a loan from its payments and fines. Implemented as a SQL function:
CREATE OR REPLACE FUNCTION loan_balance(p_loan_id uuid)
RETURNS TABLE (
  total_paid_paise bigint,
  total_fines_paise bigint,
  fines_cleared_paise bigint,
  outstanding_principal_paise bigint
) AS $$
  -- Implementation in business-rules.md §3
$$ LANGUAGE plpgsql STABLE;
Details in business-rules.md (see Business Rules).

4. Row Level Security policies
RLS is enabled on every table. Policies enforce:
Companies/users/memberships: only readable by users with at least one membership in the affected company.
All other tables: filtered by company_id matching one of the user's active memberships.
Owner-only data: profit, P&L queries route through a security-definer function checking role = 'owner'.
Helper: current_user_company_ids()
CREATE OR REPLACE FUNCTION current_user_company_ids()
RETURNS SETOF uuid AS $$
  SELECT company_id FROM company_memberships
  WHERE user_id = auth.uid() AND active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
Helper: current_user_role(p_company_id uuid)
CREATE OR REPLACE FUNCTION current_user_role(p_company_id uuid)
RETURNS text AS $$
  SELECT role FROM company_memberships
  WHERE user_id = auth.uid() AND company_id = p_company_id AND active = true
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
Policy patterns
Read access on domain tables:
CREATE POLICY "members_can_read"
  ON customers FOR SELECT
  USING (company_id IN (SELECT current_user_company_ids()));
Write access — owner or clerk:
CREATE POLICY "members_can_insert"
  ON customers FOR INSERT
  WITH CHECK (company_id IN (SELECT current_user_company_ids()));
Owner-only writes (settings, role changes):
CREATE POLICY "owner_only_update"
  ON companies FOR UPDATE
  USING (current_user_role(id) = 'owner');
Clerks can't read income data: P&L queries route through a security-definer function that explicitly checks the caller's role.
Specific policies are written in migrations. The above patterns apply to most tables.

5. Key invariants
Maintained by application code (Server Actions) and verified by checks:
DCS number is unique per company and sequentially assigned.
Implementation: take advisory lock on companies.dcs_next_number, increment, release. Use within the loan/customer create transaction.
Loan paper_amount + cash_component = amount for DP loans.
CHECK constraint: (product != 'dp') OR (paper_amount_paise + cash_component_paise = amount_paise).
Payment amounts can be negative (for corrections), but a loan's running balance can never go below zero by a negative payment.
Enforced in the recordPayment Server Action.
Audit log writes happen in the same transaction as the data write.
Use a wrapper utility withAudit(tx, entity, action, before, after, note).
Rating change without a note for manual sources is rejected.
CHECK constraint: (source NOT IN ('manual_owner', 'manual_clerk')) OR (note IS NOT NULL AND length(note) > 0).
Rating suggestions are idempotent — running the rule engine twice doesn't create duplicates.
Enforced by the UNIQUE WHERE pending constraint.
A loan in closed, written_off, or converted status cannot receive new payments.
Enforced in Server Action.
recorded_by on payments and created_by on loans match the authenticated user.
Server Action sets this from session, never trusts client input.

6. Migration strategy
Migrations in supabase/migrations/<timestamp>_<name>.sql.
Forward-only — never edit a migration that has been merged.
New columns: add as nullable, backfill, then add NOT NULL constraint in a follow-up migration if needed.
Renaming columns: add new column, sync writes, migrate reads, drop old column.
Always include the corresponding RLS policy in the same migration as the table.

7. Seed data
Required at first boot:
companies rows for Jeevana and Phenix.
A default owner user (created via Supabase Auth, then row in users and company_memberships for both companies).
A test mode companies row tagged is_test = true (Phase 7 — not at launch).
Sample customers/loans for development environment only. Never in production.
Seed lives in supabase/seed.sql and runs after supabase reset.

8. Backup and recovery
Supabase takes automatic daily Postgres backups, retained 30 days.
Weekly export via Edge Function to owner's Google Drive: full schema dump + Excel exports of each table.
Restore procedure documented in docs/runbook-restore.md (created during Phase 1).

9. Indexing strategy
Beyond the indexes called out per table:
Composite index (company_id, created_at) on all major tables for paginated reads.
Partial index on loans where status = 'active' — most queries filter by active.
GIN index on customers.name via tsvector('simple', name) for full-text search.
B-tree on customers.phone_e164 (last-4 search uses LIKE with index hint).
Review query performance at the end of Phase 3 and add indexes based on actual slow queries, not speculation.

Business Rules
Business Rules
The gnarly product logic for Loan Manager — interest calculations, fine engines per product, rating rules, eligibility progressions, and the recovery state machine.
This is the implementation specification for everything in lib/domain/. Each section maps to a TypeScript module.
Convention: All amounts in this document are in paise (bigint) unless explicitly noted. ₹1.00 = 100 paise. Interest rates in basis points (1% = 100 bps).

1. Loan products — quick reference
Code
Company
Tenure
Repayment basis
dp (Jeevana)
Jeevana
100 days
Fixed daily pathy
dp (Phenix)
Phenix
50 days
Fixed daily pathy
wb
Both
Open-ended
Weekly interest only
db
Jeevana only
Open-ended
Daily interest only
el
Phenix only
Open-ended
Daily interest only

The combination (company, product) determines which rule set applies.

2. Disbursal math
Jeevana DP
For a requested loan amount L:
cash_component = 6% of L (e.g. ₹6,000 on ₹1,00,000; ₹3,000 on ₹50,000; ₹1,500 on ₹25,000)
paper_amount = L - cash_component (e.g. ₹94,000 on ₹1,00,000)
first_pathy = paper_amount / 100 (the first day's pathy, deducted from disbursal)
daily_pathy = L / 100 (₹1,000/day for ₹1L, ₹500/day for ₹50K, etc.)
cash_to_customer_on_day_1 = paper_amount - first_pathy minus the cash component which is given through a separate channel (not handled by the system — only recorded)
Worked example: ₹1,00,000 loan
cash_component = ₹6,000
paper_amount = ₹94,000
first_pathy = ₹940 (wait — see note below)
daily_pathy = ₹1,000
Note on first-pathy math: Owner's v3 answer suggested the customer "receives ₹89K, with ₹6K via separate channel and ₹1K as first payment." The math reconciles as:
₹1,00,000 loan, customer repays ₹1,000/day × 100 days = ₹1,00,000.
6% (₹6,000) of total flows back via a parallel channel.
₹1,000 of the paper amount is the day-1 pathy.
₹89,000 = paper-disbursed (₹94,000) − first-day pathy (₹1,000) − rounding/handling (₹4,000)? This needs developer confirmation with owner during Phase 3 build. TODO in §12.
For the build, use the deterministic formula above and surface the disbursal breakdown in the UI for owner to verify on each loan creation.
Phenix DP
Effective rate is 20% over 50 days.
For a requested loan amount L:
cash_component = 20% of L (e.g. ₹4,000 on ₹20,000; ₹5,000 on ₹25,000)
paper_amount = L - cash_component (₹16,000 on ₹20,000)
daily_pathy = L / 50 (₹400/day for ₹20K, ₹500/day for ₹25K, ₹600/day for ₹30K, etc.)
Day 1 = the day after disbursal (different from Jeevana).
cash_to_customer_on_day_1 = paper_amount (no first-day-pathy deduction in Phenix's stated model)
Renewal/top-up pre-fill formula: Every ₹5,000 increase in loan amount = ₹100 increase in daily pathy.
Loan amount
Daily pathy
Customer receives (paper)
₹20,000
₹400
₹16,000
₹25,000
₹500
₹20,000
₹30,000
₹600
₹24,000
₹35,000
₹700
₹28,000
₹40,000
₹800
₹32,000

Phenix DP top-up at 40 instalments
A Phenix DP customer who has paid 40 successful daily instalments can request a higher loan. System workflow:
Calculate outstanding from current loan: outstanding = current.daily_pathy × (50 - days_paid) (typically daily_pathy × 10).
Owner enters new loan amount L_new.
New loan calculated as above (cash_component, paper_amount, new daily_pathy).
Disbursal to customer = paper_amount − outstanding from old loan.
Old loan auto-closed with status converted and note "settled via top-up to <new_loan_id>".
New loan starts the next day.
Worked example: Customer has ₹20K DP with 40 paid, ₹4K outstanding. Requests ₹25K top-up.
New loan: ₹25K. Cash component ₹5K. Paper amount ₹20K. Daily pathy ₹500.
Disbursal to customer: ₹20,000 − ₹4,000 = ₹16,000.
Old loan closed.
New loan: 50 days × ₹500/day starting tomorrow.
Jeevana DB
For a DB loan, valid amounts are exactly {₹50,000, ₹75,000, ₹1,00,000, ₹2,00,000}. Daily interest:
Amount
Daily interest
₹50,000
₹200
₹75,000
₹300
₹1,00,000
₹400
₹2,00,000
₹800

cash_component = 0. paper_amount = amount. Customer receives amount on day 1. Pays daily_interest daily; principal stays.
Owner override on credit limit applies up to ₹2,00,000 cap.
WB (both companies)
Unit structure:
1 unit = ₹40,000
½ unit = ₹20,000
¼ unit = ₹10,000 (minimum)
Maximum: 3 units (regular customer), 6 units (special customer with owner approval)
Disbursal per unit:
Unit fraction
Loan amount
Customer receives
Weekly interest
1 unit
₹40,000
₹39,000
₹1,000
½ unit
₹20,000
₹19,500
₹500
¼ unit
₹10,000
₹9,750
₹250

First week's interest is kept upfront; weekly interest continues until customer chooses to close.
For multi-unit loans (₹80,000 = 2 units): straight multiplication. Customer receives ₹78,000; weekly interest ₹2,000.
Phenix EL
Daily interest rate: ₹25 per ₹1,000 borrowed.
Owner sets L per case, capped at ₹1,20,000 (max daily interest ₹3,000).
daily_interest = L × 25 / 1,000 (e.g. ₹125 on ₹5,000)
paper_amount = L - daily_interest (day-1 interest kept upfront; ₹4,875 on ₹5,000)
Open-ended tenure.
Customer pays daily interest from day 2, alongside any DP pathy they may have.

3. Loan balance computation
Implemented as a function in lib/domain/balance.ts and (optionally) as a Postgres function for efficient queries.
DP loans
expected_paid_to_date = MIN(elapsed_days, tenure_days) × daily_pathy
total_paid = SUM(payments.amount_paise)
total_fines_imposed = SUM(fines.amount_paise)
total_fines_cleared = SUM(fines.cleared_amount_paise)
outstanding_fines = total_fines_imposed - total_fines_cleared

balance = (tenure_days × daily_pathy) - total_paid + outstanding_fines
arrears = MAX(0, expected_paid_to_date - total_paid)
days_in_arrears = arrears / daily_pathy (rounded up)
When balance = 0 and no outstanding fines and elapsed_days >= tenure_days, the loan is eligible for closed status.
WB loans
WB loans have no fixed end. Balance is tracked as:
weeks_elapsed = floor((today - start_date) / 7)
expected_interest_payments = weeks_elapsed × weekly_interest
(The first week's interest was kept upfront, so the customer is expected to make payments starting week 2.)
expected_total_paid_to_date = MAX(0, (weeks_elapsed - 1)) × weekly_interest

total_interest_paid = SUM(payments.amount_paise) — assuming all payments are interest
arrears = MAX(0, expected_total_paid_to_date - total_interest_paid)
weeks_in_arrears = arrears / weekly_interest
principal_outstanding = paper_amount + outstanding_fines  // principal never reduces unless customer closes
To close a WB loan, customer pays principal_outstanding + any pending fines. Loan closes with status closed.
DB / EL loans
Same pattern as WB but with daily granularity instead of weekly:
days_elapsed = today - start_date  // DB Jeevana day-1 = disbursal day; EL Phenix day-1 = next day
expected_total_paid_to_date = days_elapsed × daily_interest  // for DB
expected_total_paid_to_date = MAX(0, days_elapsed - 1) × daily_interest  // for EL (day-1 deducted upfront)
arrears = MAX(0, expected_total_paid_to_date - total_paid)
days_in_arrears = arrears / daily_interest
To close: customer pays paper_amount + outstanding fines + any pending interest.
Payment allocation
When a payment is recorded, the system allocates in this order (most-to-least priority):
Oldest unfined arrears (the missed pathies for DP; missed interest for WB/DB/EL).
Oldest outstanding fines.
Current period dues.
Future dues (treated as advance payment — flagged for owner to confirm).
Allocation is computed at query time from event tables — we don't store "this payment paid off fine X". The allocation order determines what's considered "cleared" in reports.
For Phase 1–3, simplify: a payment is just an event reducing total balance. Detailed allocation can come later if needed for reports.

4. Fine engine
Implemented in lib/domain/fines.ts. Pure function: computeNewFines(loan, payments, existingFines, asOfDate) → Fine[].
Run daily by nightly-recompute cron. Idempotent (same inputs → same output; existing fines aren't duplicated).
DP fine rules (both companies)
The fine unit is 1 pathy (= daily_pathy_paise).
Trigger
Code
Fine
4 consecutive days with zero payment
dp_4_consecutive_zero
1 pathy
1 pathy in arrears for > 10 days
dp_1_arrears_10_days
1 pathy
2 pathies in arrears for > 6 days
dp_2_arrears_6_days
1 pathy
3 pathies in arrears for > 3 days
dp_3_arrears_3_days
1 pathy

Per-loan cumulation: Each trigger fires at most once per (loan, trigger_code, qualifying_period). The "qualifying period" is defined by the rule:
dp_4_consecutive_zero fires once per run of consecutive zero-payment days ≥ 4. A subsequent run of ≥ 4 days fires again.
dp_N_arrears_M_days fires when the arrears state first crosses the threshold. Doesn't fire again until the customer pays down and the state re-crosses.
Multi-loan cumulation: A customer with multiple active DP loans accrues fines per loan independently. (Owner's v3 answer: "1 PB = 1 fine, 2 PB = 2 fine, 3 PB = 3 fines.") The fine engine runs per loan; it doesn't aggregate across loans.
Within a single loan, only one fine trigger applies at a time. If both dp_2_arrears_6_days and dp_3_arrears_3_days are met, the system fires only the more severe one (the higher-numbered arrears trigger). Resolved on owner's confirmation in Phase 4 — for now, follow this rule. TODO in §12.
DB fine rules (Jeevana)
Same triggers as DP, same unit (1 "pathy" = 1 day's daily interest). Trigger codes prefixed db_.
EL fine rules (Phenix)
Same triggers as DP, same unit (1 day's daily interest). Trigger codes prefixed el_.
WB fine rules
WB compounds. The "fine base" starts at 1 unit's weekly interest and escalates over time.
Grace period: First missed weekly interest payment has a 1-week grace — no fine, but a reminder fires the day after the miss.
Compounding:
unpaid_weeks = weeks_in_arrears

if unpaid_weeks == 0:
  no fine
elif unpaid_weeks == 1:
  no fine (grace period)
elif unpaid_weeks <= 10:
  fine_this_week = 10% × weekly_interest_for_1_unit × loan_units
else:
  // After week 10, the fine base escalates by 1 unit every 10 weeks
  escalation_tier = floor((unpaid_weeks - 1) / 10)   // tier 0 for weeks 1-10, tier 1 for 11-20, etc.
  fine_base_units = loan_units × (1 + escalation_tier)
  fine_this_week = 10% × weekly_interest_per_unit × fine_base_units
Worked example on a 1-unit WB loan (₹40,000, ₹1,000/week interest):
Week
Action
Fine imposed
1
Missed payment
None (grace, reminders start day-after)
2
Still unpaid
₹100
3
Still unpaid
₹100
...


₹100/week
10
Still unpaid
₹100
11
Still unpaid
₹200 (base now 2 units)
21
Still unpaid
₹300 (base now 3 units)

Reset behaviour: On full payment of all weekly interest + all fines + (if customer wants to close) principal, the fine base resets to 1 unit. The customer is back to healthy state. Worked-out details TBD with owner in Phase 4 — see §12.
Mapping fine triggers to rating suggestions
See §6.

5. Eligibility engine
Implemented in lib/domain/eligibility.ts.
Jeevana DP progression
A customer can hold up to 6 concurrent DP loans (called "PB1" through "PB6"). Eligibility unlocks in stages:
Have
Need to qualify for next
Counter resets if
Nothing
New DP1 eligible (subject to rating)
—
1 active DP
50 successful days on DP1
Customer misses a day → counter restarts from the day they resume
2 active DPs
30 successful days on DP2 (counted from DP2 start)
Same reset rule
3 active DPs
30 successful days on DP3
Same reset rule
4 active DPs
30 successful days on DP4
Same reset rule
5 active DPs
30 successful days on DP5
Same reset rule
6 active DPs
Cap — no more DPs
—

DP4–DP6 require explicit director/owner approval per loan.
Credit limit override: Owner can increase a customer's individual loan amount up to ₹1,00,000 per loan. Logged in audit trail.
Phenix DP progression
Phenix customers can hold only one active DP at a time. The progression is on loan amount, not on count:
Status
Loan amount limit
First-time customer
₹20,000
After 1 successful closed DP
₹25,000
After 2 successful closed
₹30,000
After N (up to limit)
Next ₹5K tier, capped at ₹40,000

The 40-instalment top-up flow (see §2) allows a customer mid-loan to move up to the next tier without closing the old loan first.
WB / DB / EL eligibility
These products are owner discretion. Rules:
WB: any customer eligible for DP can request WB. Max 3 units regular, 6 units special.
DB (Jeevana): owner-discretion only. Rating must be Good or Excellent.
EL (Phenix): owner-discretion only. Up to ₹1,20,000.
Rating-gated approval
Customer rating
New loan flow
Excellent (5)
Streamlined: pre-filled higher amounts, single-click approval by clerk
Good (4)
Clerk can approve directly within product caps
Average (3)
Clerk can approve directly within product caps
Risky (2)
Owner approval required before disbursal
Defaulter (1)
Owner approval required + an additional override note

A customer in recovery state recovery or legal is treated as Defaulter for approval purposes even if their rating somehow says otherwise (defensive layer).

6. Rating engine
Implemented in lib/domain/rating.ts.
Tier definitions
Tier
Label
5
Excellent
4
Good
3
Average (default for new customer)
2
Risky
1
Defaulter

Auto-applied rules (no human review)
Trigger
Action
Code
Loan written off
→ Defaulter, locked
loan_written_off
Customer moved to recovery state recovery
→ Risky, locked
recovery_state_recovery
Customer moved to recovery state legal
→ Defaulter, locked
recovery_state_legal
Customer moved to recovery state written_off
→ Defaulter, locked
recovery_state_written_off

"Locked" means customers.rating_locked = true, blocking future auto-changes. Only owner can unlock.
Suggestion rules (system flags, owner decides)
Trigger
Suggested rating
Code
3+ fines accumulated in a single active loan
Risky
multiple_fines_single_loan
DP arrears > 10 days on any active DP
Risky
dp_arrears_10_days
WB unpaid > 2 weeks (i.e. compound base escalating)
Risky
wb_unpaid_2_weeks
EL unpaid > 7 days
Risky
el_unpaid_7_days
DP loan completed with zero missed days
One tier up (max Good unless 12-month rule)
dp_clean_completion
DP loan closed early (full settlement)
One tier up
dp_early_closure
Maintained Good or higher continuously for 12 months
Excellent
sustained_good_12_months
Customer cleared all dues after being Defaulter
Risky (recovery start)
defaulter_cleared_dues

Suggestion lifecycle
nightly-recompute cron evaluates rules per customer.
For each rule that fires and matches the customer's current state, a row is inserted into rating_suggestions (status: pending).
UNIQUE constraint prevents duplicate suggestions for the same rule.
Owner reviews on dashboard. Accepts → row inserted into rating_changes, suggestion marked accepted. Dismisses → suggestion marked dismissed with optional note.
If a suggestion goes stale (the underlying condition no longer holds — e.g. customer cleared arrears), the cron job marks it dismissed with reason auto_dismiss_stale.
Idempotency
Running the rule engine twice on the same data produces the same rating_suggestions rows (no duplicates because of UNIQUE constraint). Rules use created_at of the most recent rating change as a cutoff — they don't re-suggest a rating the customer was already moved to and back from recently (avoid yo-yo).
Locked customers
Locked customers (rating_locked = true) are skipped by all suggestion and auto-apply rules. The loan_written_off rule overrides the lock and re-locks at Defaulter.
Manual changes
Owner or clerk can manually set any rating with a mandatory note. This:
Inserts a row into rating_changes with source = 'manual_owner' or 'manual_clerk'.
If clerk-initiated, notifies the owner (email + in-app).
Does not require approval.
Manual changes can also set rating_locked = true or false.

7. Reminder engine
Implemented in lib/domain/reminders.ts. Run daily by daily-reminder-prep cron at 08:00 IST.
Eligibility for reminder
For each active loan, evaluate:
Product
Reminder starts
Frequency
DP (both companies)
After 3 days of non-payment
Daily
EL (Phenix)
After 3 days of non-payment
Daily
WB (both companies)
Day after a missed weekly interest payment
Daily
DB (Jeevana)
After 3 days of non-payment
Daily

The reminder doesn't escalate or vary by recovery state for now. (Phase 5 may add customisation.)
What gets queued
For each loan needing a reminder today, insert a row into notification_queue:
type = 'reminder'
customer_id, loan_id, company_id
payload_en and payload_ml rendered from templates (interpolating customer name, amount, due date, etc.)
scheduled_for = today, 09:00–19:00 window
status = 'queued'
Sending
Staff sees the queue in the reminders UI. Each entry shows the message preview. Tap "Send" → opens wa.me/<phone>?text=<encoded message> → staff taps "Send" in WhatsApp. App marks the row sent and records sent_by/sent_at.
Bulk send: staff can select multiple rows and tap through them in sequence.
Skipping
A reminder can be skipped (status skipped) by clerk or owner — for example, if they just spoke to the customer.

8. Recovery state machine
Implemented in lib/domain/recovery.ts. Tracks each customer's recovery state independently of their loans.
States
[ State Machine — renders natively in the GitHub repo / Markdown viewer ]
stateDiagram-v2
  [*] --> Healthy
  Healthy --> Watch : 1 fine imposed
  Watch --> Healthy : All fines cleared
  Watch --> FollowUp : 2+ weeks unpaid (WB) OR 5+ days arrears (DP/EL/DB)
  FollowUp --> Watch : Significant payment, arrears reduced
  FollowUp --> Healthy : All caught up
  FollowUp --> Recovery : 8+ weeks unpaid (WB) OR 21+ days arrears (DP/EL/DB)
  Recovery --> FollowUp : Customer engaging + paying
  Recovery --> Legal : Owner manually moves
  Recovery --> WrittenOff : Owner manually moves
  Legal --> WrittenOff : Owner manually moves
  Legal --> Recovery : Settlement, owner manually moves back
  WrittenOff --> [*]
Transitions
From → To
Trigger
Who
Healthy → Watch
First fine imposed
System (auto)
Watch → FollowUp
Arrears cross product-specific threshold (see above)
System (auto)
FollowUp → Recovery
Arrears cross product-specific threshold
System (auto)
Watch → Healthy
All fines cleared
System (auto)
FollowUp → Watch
Arrears reduced below FollowUp threshold
System (auto)
FollowUp → Healthy
All caught up
System (auto)
Recovery → FollowUp
Significant payment
System (auto)
Recovery → Legal
Owner triggers
Owner only
Legal → WrittenOff
Owner triggers
Owner only
Legal → Recovery
Settlement reached
Owner only
Recovery → WrittenOff
Owner triggers
Owner only

State effects
State
Reminder behaviour
Rating behaviour
UI behaviour
Healthy
Normal reminders if applicable
Normal
Default
Watch
Normal reminders
Watch (no auto rating change)
Yellow flag on dashboard
FollowUp
Normal reminders + flagged on long-pending tracker
Suggest Risky
Orange flag
Recovery
Suspend automated reminders. Manual outreach only. Recovery log: each visit, call, conversation.
Auto → Risky, locked
Red flag, recovery log UI
Legal
No automated messages. All activity logged.
Auto → Defaulter, locked
Red flag, legal log UI
WrittenOff
No automated messages
Auto → Defaulter, locked
Archived

A customer can have multiple active loans in different "states of unpaid." The customer's overall recovery state is determined by the worst of any of their active loans' state. (E.g. one DP healthy + one WB in FollowUp → customer is in FollowUp.)

9. DP → WB conversion
Owner-initiated workflow when a DP customer is in financial trouble.
Trigger
Owner opens the customer's DP loan.
Clicks "Convert to WB" (visible only when loan is active, customer's recovery state is follow_up or worse, OR owner override flag).
Workflow
System computes outstanding_balance of the DP loan (per §3).
Owner selects WB unit count for the new loan such that unit_count × ₹40,000 ≈ outstanding_balance. Round up — the new WB principal becomes the unit-count's nominal value, even if the outstanding is less.
System creates a new WB loan:
amount = wb_units × ₹40,000
paper_amount = wb_units × ₹40,000
cash_component = 0
weekly_interest = wb_units × ₹1,000
start_date = today
converted_from_loan_id = <old DP loan id>
System closes the old DP loan:
status = 'converted'
closed_at = now()
State change logged.
The first week of the new WB is treated as "interest pre-paid" — exactly like a normal WB disbursal, except no cash flows.
Audit log entries on both loans.
Customer is notified via tap-to-send (owner-initiated).
Edge case: outstanding > 6 units (₹2,40,000)
Rare for DP, but if it occurs: requires explicit owner override. Cap at 6 units. The unrecoverable portion is owner's decision (could be carried as a separate customer_notes flag or loans entry marked written_off for the excess).

10. Campaign / marketing logic
Targeting filters
A campaign's filters JSON supports:
{
  "rating_tiers": [4, 5],         // any of these tiers
  "products_history": ["wb"],     // customer has had any loan of these products
  "products_active": ["dp"],      // customer currently has an active loan of these products
  "areas": ["Shornur", "Thrissur"],  // by customer.area
  "min_loans_closed": 3,          // customer has closed at least N loans
  "exclude_recovery_states": ["recovery", "legal", "written_off"],  // skip these states
  "preferred_language": "ml"      // optional
}
Defaulters are not auto-excluded. Owner can include them by leaving exclude_recovery_states empty.
Preview and approval
When owner clicks "Preview":
System runs the filter, returns a list of matching customers with rating, recovery state, language, last contact date.
Shows count breakdowns by tier, area, language.
Owner reviews and either approves (status → approved) or makes changes.
Sending
On approval, system creates campaign_recipients rows for each matched customer. Status starts as pending. Staff sees a "Send Campaign Messages" screen and taps through.

11. Audit log invariants
Every domain write must produce an audit log entry. Rules:
One transaction = one audit log row for the primary action. Cascading changes (e.g. rating change triggered by manual loan write-off) can produce additional rows in the same transaction.
Action codes: created, updated, deleted, state_changed, rating_changed, payment_recorded, fine_imposed, loan_disbursed, loan_closed, loan_converted, loan_written_off, suggestion_resolved, campaign_approved, etc.
Before/after JSON: for updated, capture only changed fields. For created, before is null and after is the full row. For deleted, after is null.
Actor: the authenticated user. For system actions (cron jobs), actor_id = null and actor_role = 'system'.
Note: the user-supplied reason text, or for system actions, the rule code.
A utility withAudit(tx, ...) in lib/audit/ enforces this. All Server Actions must use it.

12. Open items for confirmation during build
Things the developer should check with the owner during Phase 3 build:
Jeevana DP first-day cash reconciliation (§2). The math suggested by the owner (₹89K to customer + ₹6K separate channel + ₹1K first pathy = ₹96K, not ₹100K) doesn't fully balance to the loan total. May be a description simplification, or there's a ₹4K/₹6K nuance the build should surface. Use the deterministic formula and confirm with owner on first DP creation.
DP fine triggers — exclusive vs. cumulative (§4). Currently spec assumes "only the most severe applies." Owner's v3 answer "1 PB = 1 fine, 2 PB = 2 fine" addresses cross-loan cumulation but not within-loan. Confirm during Phase 4 fine engine build.
WB compound reset details (§4). After customer pays everything, fine base resets to 1 unit. But does the customer need to also pay a "re-entry" penalty? Confirm during Phase 4.
DB amounts — strict tiers or flexible? (§2). Spec says exactly {50K, 75K, 1L, 2L}. Confirm if owner ever does ₹1.5L for example.
Recovery state thresholds (§8). The day/week thresholds for Watch → FollowUp → Recovery are derived from spec discussions. Confirm during Phase 5.
Reminder time-of-day windowing. Spec says 9 AM – 7 PM. Implementation can either send reminders at any time within window, or batch them into morning push (08:00) and let staff send through the day. Default: morning batch, send-through-the-day model.
Festival greeting calendar. Onam, Vishu, Eid, Christmas dates change yearly. Configure as a holiday_calendar table (low priority, Phase 6).
These don't block design. Document the decision and move on.

API Contracts
API Contracts
This document describes the server-side surface of Loan Manager: Server Actions, Route Handlers, and Background Job contracts.
The Next.js App Router pattern means most reads and writes are Server Actions (RPC-style), with Route Handlers used only for webhooks, exports, cron triggers, and any third-party integrations. There is no public REST API for this application.
Audience: the developer implementing these endpoints, and any future developer extending them.

1. Conventions
Server Action signature
async function actionName(
  input: ZodSchemaType
): Promise<
  | { success: true; data: SuccessShape }
  | { success: false; error: { code: string; message: string; details?: unknown } }
>
Rules:
Never throw across the network boundary. Always return { success: false, error } for known failures.
Use Zod for input validation. Same schema on client and server.
Always include the company context — derive company_id from the session, never accept from client.
Always write an audit log entry (via withAudit()) for state changes.
Return only what the caller needs — don't bulk-return entire entities.
Route Handler signature
export async function POST(req: Request): Promise<Response>
Rules:
Used for cron triggers, file downloads, webhooks.
Auth-protected by middleware (middleware.ts) checking for valid session OR Vercel Cron secret.
Return appropriate HTTP status codes.
Background Job (Edge Function) signature
Deno.serve(async (req) => {
  // Verify cron secret
  // Do work
  // Return Response
})
Error codes
Standardized:
Code
Meaning
validation_failed
Input failed Zod schema
not_found
Entity doesn't exist or RLS hides it
forbidden
Authenticated but lacks permission
conflict
State conflict (e.g. duplicate DCS)
business_rule_violation
Domain rule blocked the action
external_service_failed
Supabase/Resend/etc. error
internal_error
Unexpected — log to Sentry


2. Authentication actions
Implemented by Supabase Auth. Listed here for completeness.
signIn
input: { email: string; password: string }
output: { success: true; requiresMfa: boolean } | { error }
If requiresMfa, client prompts for TOTP and calls verifyMfa.
verifyMfa
input: { code: string }
output: { success: true } | { error }
signOut
input: {}
output: { success: true }
inviteClerk (owner only)
input: { email: string; fullName: string; companyId: string }
output: { success: true; userId: string } | { error }
Sends invitation email via Supabase Auth. Creates row in users and company_memberships (role: 'clerk').

3. Company & session actions
getCurrentSession
Returns the authenticated user, their memberships, and the currently selected company.
input: {}
output: {
  success: true;
  data: {
    user: { id: string; email: string; fullName: string; preferredLanguage: 'en' | 'ml' };
    memberships: { companyId: string; companyName: string; role: 'owner' | 'clerk' }[];
    currentCompanyId: string;
  }
}
switchCompany (owner only)
input: { companyId: string }
output: { success: true } | { error: 'forbidden' }
Updates the session's selected company. RLS automatically scopes subsequent queries.
updateProfile
input: { fullName?: string; preferredLanguage?: 'en' | 'ml' }
output: { success: true }
updateCompany (owner only)
input: { legalName?: string; address?: string; phone?: string; licenseNumber?: string; termsText?: string; logoFile?: File }
output: { success: true }
Updates the current company's record. Logo uploaded to Supabase Storage; path stored in companies.logo_path.

4. Customer actions
searchCustomers
input: {
  query: string;           // DCS, name, or phone fragment
  limit?: number;          // default 20
  offset?: number;         // for pagination
}
output: {
  success: true;
  data: {
    customers: CustomerSummary[];
    total: number;
  }
}

type CustomerSummary = {
  id: string;
  dcsNumber: string;
  name: string;
  phoneE164: string;
  area: string | null;
  currentRating: 1 | 2 | 3 | 4 | 5;
  ratingLocked: boolean;
  recoveryState: 'healthy' | 'watch' | 'follow_up' | 'recovery' | 'legal' | 'written_off';
  activeLoanCount: number;
  totalActivePrincipalPaise: bigint;
};
Query strategy:
If query is all digits, try DCS number first, then phone last 4.
Otherwise, full-text search on name.
getCustomer
input: { dcs: string }
output: { success: true; data: CustomerDetail } | { error: 'not_found' }

type CustomerDetail = CustomerSummary & {
  fullAddress: string | null;
  idProofType: string | null;
  idProofNumber: string | null;
  preferredLanguage: 'en' | 'ml';
  source: string | null;
  initialRating: 1 | 2 | 3 | 4 | 5;
  initialRatingNote: string | null;
  photoPath: string | null;
  createdAt: string;
  activeLoans: LoanSummary[];
  recentPayments: PaymentSummary[];
  notes: CustomerNoteSummary[];
  ratingHistory: RatingChangeSummary[];
  recoveryHistory: RecoveryStateChangeSummary[];
};
createCustomer
input: {
  dcsNumber?: string;          // optional: auto-generated if not provided
  name: string;
  phoneE164: string;
  area?: string;
  fullAddress?: string;
  idProofType?: 'aadhaar' | 'pan' | 'voter' | 'driving_license' | 'other';
  idProofNumber?: string;
  preferredLanguage: 'en' | 'ml';
  source?: string;
  initialRating: 1 | 2 | 3 | 4 | 5;
  initialRatingNote?: string;
  photoFile?: File;
}
output: { success: true; data: { customerId: string; dcsNumber: string } } | { error }
DCS auto-generation: takes advisory lock on companies.dcs_next_number, increments, returns formatted DCS<n>.
Writes:
customers row.
rating_changes row with source = 'initial', previous_rating = NULL, new_rating = initialRating.
audit_log row.
updateCustomer
input: {
  customerId: string;
  fields: Partial<{
    name: string;
    phoneE164: string;
    area: string;
    fullAddress: string;
    idProofType: ...;
    idProofNumber: string;
    preferredLanguage: 'en' | 'ml';
  }>;
}
output: { success: true } | { error }
Does NOT update rating — see rating actions.
addCustomerNote
input: { customerId: string; note: string; category: 'general' | 'follow_up' | 'conversation' | 'referral' | 'flag' }
output: { success: true; data: { noteId: string } }

5. Rating actions
changeRating
input: {
  customerId: string;
  newRating: 1 | 2 | 3 | 4 | 5;
  note: string;        // required
  setLock?: boolean;   // optional: also set the lock state
}
output: { success: true } | { error: 'forbidden' | 'business_rule_violation' }
Allowed for both owner and clerk.
source set to 'manual_owner' or 'manual_clerk' based on caller's role.
Writes rating_changes row.
If clerk, sends notification to owner via notification_queue (in-app) + Resend (email).
If note is empty or missing, returns validation_failed.
setRatingLock
input: { customerId: string; locked: boolean; note: string }
output: { success: true } | { error }
Updates customers.rating_locked. Logged via audit_log.
acceptRatingSuggestion
input: { suggestionId: string; note?: string }
output: { success: true } | { error: 'not_found' | 'conflict' }
Marks suggestion accepted.
Inserts rating_changes row with source = 'suggestion_accepted'.
Audit log.
dismissRatingSuggestion
input: { suggestionId: string; note?: string }
output: { success: true } | { error }
listPendingSuggestions
input: {}
output: {
  success: true;
  data: RatingSuggestion[];
}

type RatingSuggestion = {
  id: string;
  customerId: string;
  customerName: string;
  customerDcs: string;
  currentRating: number;
  suggestedRating: number;
  ruleCode: string;
  reasonDetail: string;
  createdAt: string;
};
For dashboard widget.

6. Loan actions
createLoan
input: {
  customerId: string;
  product: 'dp' | 'wb' | 'db' | 'el';
  amountPaise: bigint;       // for DP/DB/EL; for WB: derived from unit count
  wbUnits?: number;          // for WB only
  wbUnitFractionDenominator?: 1 | 2 | 4;  // for WB only
  interestRateBps?: number;  // default 1600
  startDate?: string;        // ISO date; default today
  overrideApprovedNote?: string;  // required when customer is Risky/Defaulter
  manualOverrides?: {
    paperAmountPaise?: bigint;
    cashComponentPaise?: bigint;
    firstPathyPaise?: bigint;
    dailyPathyPaise?: bigint;
    // etc.
  };
}
output: {
  success: true;
  data: { loanId: string; disbursalBreakdown: DisbursalBreakdown }
} | { error }

type DisbursalBreakdown = {
  amountPaise: bigint;
  paperAmountPaise: bigint;
  cashComponentPaise: bigint;
  firstPathyPaise: bigint | null;
  dailyPathyPaise: bigint | null;
  weeklyInterestPaise: bigint | null;
  dailyInterestPaise: bigint | null;
  customerReceivesPaise: bigint;
  totalRepayablePaise: bigint;
  tenureDays: number | null;
};
Process:
Validate input against Zod schema.
Check rating-gated approval (§5 business rules). Reject without overrideApprovedNote for Risky/Defaulter.
Check eligibility (§5 business rules) — verifies the customer can take this product.
Compute disbursal breakdown via lib/domain/disbursal.ts.
Insert loans row.
Insert loan_state_changes row (initial: null → 'active').
Audit log.
Return loan ID + breakdown.
recordPayment
input: {
  loanId: string;
  amountPaise: bigint;
  paymentDate: string;        // ISO date
  paymentMethod: 'upi' | 'bank_transfer' | 'adjustment';
  referenceNumber: string;    // required
  note?: string;
}
output: {
  success: true;
  data: {
    paymentId: string;
    newBalance: LoanBalance;
    messagePreview: { en: string; ml: string };
  }
} | { error }
Process:
Validate.
Check loan status is active.
Insert payments row.
Audit log.
Compute new balance via lib/domain/balance.ts.
Compute rating suggestions (if payment cleared arrears, etc.).
If loan now has zero balance and tenure complete → suggest closure.
Render confirmation message templates.
Insert into notification_queue (payment_confirmation).
closeLoan (owner only)
input: {
  loanId: string;
  finalStatus: 'closed' | 'written_off';
  note: string;
}
output: { success: true } | { error }
Sets loans.status and closed_at.
For written_off: triggers rating auto-rule → Defaulter, locked.
Inserts loan_state_changes.
Audit log.
convertDpToWb (owner only)
input: {
  dpLoanId: string;
  wbUnits: number;
  wbUnitFractionDenominator: 1 | 2 | 4;
  startDate?: string;
  note: string;
}
output: { success: true; data: { newWbLoanId: string } } | { error }
Atomic transaction:
Compute DP outstanding.
Close DP loan: status = 'converted', closed_at = now().
Create new WB loan with converted_from_loan_id pointer.
Audit log entries on both.
Queue customer notification.
phenixTopUp (owner only)
input: {
  oldLoanId: string;
  newAmountPaise: bigint;
  note?: string;
}
output: {
  success: true;
  data: {
    newLoanId: string;
    disbursalBreakdown: DisbursalBreakdown;
    cashPaidToCustomerPaise: bigint;
  }
} | { error }
Atomic transaction:
Validate: old loan is Phenix DP, customer has paid ≥ 40 instalments.
Compute outstanding on old loan.
Compute new loan disbursal breakdown.
Compute cash to customer: newLoan.paperAmountPaise - oldLoan.outstandingPaise.
Close old loan as converted.
Create new loan with renewed_from_loan_id.
Audit log entries.
getLoanDetail
input: { loanId: string }
output: { success: true; data: LoanDetail } | { error }

type LoanDetail = {
  // loan fields
  ...
  customer: CustomerSummary;
  balance: LoanBalance;
  payments: PaymentSummary[];
  fines: FineSummary[];
  events: LoanEvent[];   // state changes
};

type LoanBalance = {
  totalPaidPaise: bigint;
  totalFinesImposedPaise: bigint;
  totalFinesClearedPaise: bigint;
  outstandingFinesPaise: bigint;
  outstandingPrincipalPaise: bigint;
  arrearsPaise: bigint;
  daysOrWeeksInArrears: number;
  status: 'healthy' | 'watch' | 'follow_up' | 'recovery';
};

7. Recovery state actions
changeRecoveryState
input: {
  customerId: string;
  newState: 'recovery' | 'legal' | 'written_off';
  note: string;       // required
}
output: { success: true } | { error: 'forbidden' | 'invalid_transition' }
Owner-only. Validates state transitions per the state machine (§8 business rules).
Auto-rules:
→ recovery triggers rating auto → Risky, locked.
→ legal triggers rating auto → Defaulter, locked.
→ written_off triggers rating auto → Defaulter, locked.
logRecoveryActivity
input: {
  customerId: string;
  activityType: 'visit' | 'call' | 'message' | 'meeting';
  note: string;
}
output: { success: true }
Inserts a customer_notes row with category = 'conversation' and a structured payload.

8. Notification & messaging actions
prepareReminder
input: { loanId: string }
output: {
  success: true;
  data: {
    waUrl: string;       // wa.me link with pre-filled message
    messageText: string;
    customerLanguage: 'en' | 'ml';
  }
}
Renders the reminder template, encodes it, and returns the wa.me/<phone>?text=... URL.
markReminderSent
input: { notificationQueueId: string }
output: { success: true }
Marks a queued notification as sent.
prepareBulkReminders
input: { notificationQueueIds: string[] }
output: {
  success: true;
  data: { items: { id: string; waUrl: string; messageText: string }[] }
}
For bulk-send UX.
createCampaign (owner only)
input: {
  name: string;
  messageTemplateEn: string;
  messageTemplateMl: string;
  filters: {
    ratingTiers?: number[];
    productsHistory?: ('dp' | 'wb' | 'db' | 'el')[];
    productsActive?: ('dp' | 'wb' | 'db' | 'el')[];
    areas?: string[];
    minLoansClosed?: number;
    excludeRecoveryStates?: ('recovery' | 'legal' | 'written_off')[];
    preferredLanguage?: 'en' | 'ml';
  };
}
output: { success: true; data: { campaignId: string; matchedCount: number; breakdown: Breakdown } }

type Breakdown = {
  byTier: Record<number, number>;
  byArea: Record<string, number>;
  byLanguage: { en: number; ml: number };
};
Status starts as draft.
approveCampaign (owner only)
input: { campaignId: string }
output: { success: true; data: { recipientCount: number } }
Inserts campaign_recipients rows for each matched customer.
Sets campaign status to approved.
sendCampaignRecipient
input: { campaignRecipientId: string }
output: { success: true; data: { waUrl: string; messageText: string } }
Returns the wa.me URL for the staff to tap. Marks recipient as sent.

9. Report & export actions
getDashboardSummary
input: {}
output: {
  success: true;
  data: {
    totalActiveLoansPaise: bigint;       // current company
    yesterdayDisbursedPaise: bigint;
    yesterdayCollectedPaise: bigint;
    overdueCount: number;
    dueIn10DaysCount: number;
    eligibleForRenewalCount: number;
    crossingFineThresholdCount: number;
    overnightRatingChanges: number;
    pendingSuggestionsCount: number;
  };
}
getLongPendingTracker
input: {
  sortBy: 'days_late_desc' | 'amount_desc' | 'rating_asc';
  filters?: {
    ratingTiers?: number[];
    products?: ('dp' | 'wb' | 'db' | 'el')[];
    recoveryStates?: string[];
  };
  limit?: number;
  offset?: number;
}
output: {
  success: true;
  data: { items: TrackerItem[]; total: number };
}

type TrackerItem = {
  customerId: string;
  dcsNumber: string;
  customerName: string;
  rating: number;
  recoveryState: string;
  loanId: string;
  product: string;
  daysOrWeeksLate: number;
  arrearsPaise: bigint;
  lastContactAt: string | null;
  lastContactNote: string | null;
};
getDisbursalReport (owner only)
input: { startDate: string; endDate: string; companyId?: string; product?: string }
output: {
  success: true;
  data: { rows: { date: string; product: string; count: number; totalPaise: bigint }[]; grandTotalPaise: bigint };
}
getCollectionReport (owner only)
Mirror of disbursal report for payments.
getMonthlyPnl (owner only)
input: { year: number; month: number }
output: {
  success: true;
  data: {
    interestEarnedPaise: bigint;
    finesCollectedPaise: bigint;
    expensesPaise: bigint;
    profitEstimatePaise: bigint;
    breakdown: { product: string; interestPaise: bigint; finesPaise: bigint }[];
  };
}
getYearlySummary (owner only)
For GST submission.
input: { financialYear: string }   // e.g. "2025-26"
output: {
  success: true;
  data: { /* shape TBD with accountant in Phase 5 */ };
}
exportToExcel
input: {
  entity: 'customers' | 'loans' | 'payments' | 'fines' | 'rating_history' | 'audit_log';
  filters?: Record<string, unknown>;
}
output: { success: true; data: { downloadUrl: string } } | { error }
Generates an Excel file via exceljs and uploads to Supabase Storage. Returns a signed URL valid for 24 hours.
Owner-only for sensitive entities (payments aggregated income data, audit_log).

10. Route Handlers (HTTP endpoints)
GET /api/exports/[fileId]
Downloads a previously-generated export. Signed URL check.
POST /api/cron/nightly-recompute
Triggered by Vercel Cron (daily 06:00 IST). Auth: Authorization: Bearer <CRON_SECRET>.
Runs the rule engines:
Fine engine for every active loan.
Recovery state transition checks.
Rating suggestion generation.
Stale suggestion auto-dismissal.
Returns { processed: { loans: N, suggestionsCreated: M, transitionsMade: K } }.
POST /api/cron/daily-reminder-prep
Triggered by Vercel Cron (daily 08:00 IST). Auth: cron secret.
Queues reminders for the day per §7 business rules.
POST /api/cron/weekly-backup
Triggered by Vercel Cron (weekly Sunday 02:00 IST). Auth: cron secret.
Triggers the weekly-backup Edge Function which exports to owner's Google Drive.
POST /api/cron/monthly-summary
Triggered by Vercel Cron (1st of month, 06:00 IST). Auth: cron secret.
Generates prior month's P&L. Emails to owner via Resend.
POST /api/cron/cleanup-recycle-bin
Triggered by Vercel Cron (daily 04:00 IST). Auth: cron secret.
Permanently deletes records soft-deleted > 30 days ago.

11. Edge Functions
Heavy or external-integration work.
weekly-backup
Connects to owner's Google Drive via OAuth credentials stored in Supabase secrets. Exports each table as Excel, uploads to a dated folder.
kyc-verification (Phase 6)
Wraps the chosen KYC API provider (Cashfree, Karza, or similar). Returns structured verification result.
cibil-check (Phase 6)
Wraps CIBIL API.

12. Type sharing
All input/output types live in lib/schemas/ as Zod schemas. The TypeScript types are derived:
// lib/schemas/loans.ts
import { z } from 'zod';

export const createLoanInput = z.object({
  customerId: z.string().uuid(),
  product: z.enum(['dp', 'wb', 'db', 'el']),
  amountPaise: z.bigint().positive(),
  // ...
});

export type CreateLoanInput = z.infer<typeof createLoanInput>;
Server Actions:
// app/(app)/loans/actions.ts
'use server';
import { createLoanInput, CreateLoanInput } from '@/lib/schemas/loans';

export async function createLoan(rawInput: unknown) {
  const parsed = createLoanInput.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: { code: 'validation_failed', ... } };
  const input = parsed.data;
  // ...
}
Client uses the same schema for form validation, gets fully typed inputs/outputs.

13. What's NOT in this API
No GraphQL. Server Actions provide RPC-style data access.
No REST endpoints for client consumption. All client-server interaction is Server Actions.
No webhooks (yet). If KYC/CIBIL APIs require webhook callbacks, we'll add Route Handlers in Phase 6.
No SDK or external API. This is an internal application. No third party will call it.

Build Plan
Build Plan
Phased delivery plan for Loan Manager. Each phase delivers a usable slice; the owner can use the app productively after every phase.
This plan assumes one developer working part-time (evenings + weekends, ~15 hours/week). Total ~12 weeks of part-time work, deployable to production after Phase 3 (week 6) for early use.

Overview
Phase
Name
Effort
Cumulative
Outcome
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

Phase 0 — Project setup
Outcome: Empty Next.js app deployed to production. Local dev environment working. Repo, CI, monitoring live.
Tasks
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
Definition of Done
☐ Production URL serves a placeholder "Loan Manager" page.
☐ Localhost runs the app and local Supabase together.
☐ PR opens a preview deployment.
☐ CI passes lint, typecheck, build.
☐ Sentry receives a test error.
☐ All spec docs in /docs on main.

Phase 1 — Foundation
Outcome: Owner and clerk can log in. Owner can switch between Jeevana and Phenix. Sidebar navigation works. Empty dashboard shows.
Tasks
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
Definition of Done
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

Phase 2 — Customers, DCS lookup, ratings (manual)
Outcome: Owner and clerk can register customers, look them up by DCS / name / phone, and set/change their rating with notes. Audit trail covers all changes. Auto-rating rules NOT yet implemented (Phase 4).
Tasks
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
Definition of Done
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

Phase 3 — Loans + payments
Outcome: Both companies can issue all four products and record payments. Outstanding balances compute live. Convert and top-up workflows work.
This is the biggest phase. Break it into product-by-product slices.
Tasks
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
Definition of Done
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

Phase 4 — Fines, eligibility, rating engine
Outcome: System auto-imposes fines per product rules. Tracks eligibility for renewals and progressions. Generates rating suggestions for owner review.
Tasks
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
Definition of Done
☐ Cron runs daily; fines appear on overdue loans.
☐ Suggestions appear in dashboard widget.
☐ Owner accepts/dismisses suggestions; rating history shows the change.
☐ Recovery state auto-transitions through Watch / FollowUp / Recovery.
☐ Manual transitions to Legal / WrittenOff work (owner only).
☐ Recovery activities log per customer.
☐ Eligibility flags correct customers.
☐ Domain layer 100% tested with edge cases for each product.

Phase 5 — Reports + long-pending tracker
Outcome: Dashboards, daily/weekly/monthly reports, long-pending tracker, Excel export. Owner has full visibility into the business.
Tasks
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
Definition of Done
☐ Dashboard loads in < 1s on production.
☐ All reports filter by company; "both companies" combined view for owner.
☐ Clerk cannot access P&L or yearly summary (RLS-enforced).
☐ Excel exports work for all entity types.
☐ Long-pending tracker is the operational tool for daily collections.

Phase 6 — Reminders, messages, campaigns
Outcome: Customer messaging works end to end. Reminders queued daily, staff taps to send. Festival greetings, payment confirmations, campaigns.
Tasks
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
Definition of Done
☐ Daily reminder cron queues reminders accurately.
☐ Owner / clerk can send reminders in 2 taps.
☐ Festival greeting sends with branded image.
☐ Campaign filtering produces correct recipient lists.
☐ Defaulters not auto-excluded; owner picks per campaign.

Phase 7 — Polish + go-live
Outcome: App is production-ready. 2FA enforced. Offline mode works. Mobile UX is polished. Owner and clerks trained.
Tasks
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
Definition of Done
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

Glossary
Glossary
Product terms used in Loan Manager. Read this if you encounter an unfamiliar acronym in the other docs.

Loan products
DP — Daily Pathy. Customer takes a loan and repays in equal daily instalments over a fixed tenure. Each daily payment is called a "pathy" (Malayalam: പതി, meaning instalment).
Jeevana DP: 100 days, ₹25K–₹1L range.
Phenix DP: 50 days, ₹5K–₹40K range.
WB — Weekly Block. Customer takes a loan and pays only interest weekly; the principal stays outstanding. Open-ended — customer chooses when to close by paying back the principal. Loan amount is in "units" of ₹40,000.
DB — Daily Block. Like WB but daily interest. Open-ended. Jeevana only. Strict amounts: ₹50K / ₹75K / ₹1L / ₹2L.
EL — Emergency Loan. Phenix only. Daily-interest loan, owner discretion, up to ₹1,20,000. ₹25/day per ₹1,000 borrowed.
Customer terms
DCS. The customer's master account number. Each company has its own sequence. Display format: DCS111. Jeevana starts at DCS111 at go-live; Phenix starts at DCS1239.
Pathy. A daily instalment in DP. Plural: pathies.
PB / PB1–PB6. A Jeevana DP slot. A customer can hold up to 6 concurrent DP loans, labelled PB1, PB2, ... PB6. PB4–PB6 require owner approval.
Unit (WB). ₹40,000 of principal. ½ unit = ₹20K, ¼ unit = ₹10K.
RCL — Rolling Credit Limit. The current maximum exposure the company will extend to a customer across all their loans, computed dynamically from their rating, history, and active loans. (Display concept; not a stored field.)
Operational terms
Top-up. Phenix DP customer at 40 paid instalments requests a higher loan. System closes old loan, opens new with the next tier amount, deducts old outstanding from the new disbursal.
Conversion. Owner moves a struggling DP customer to a WB loan. Old DP closes; new WB takes the unpaid balance as principal.
Cash component. The portion of a loan that flows via a separate channel (not through the system's recorded receipts). 6% for Jeevana DP, 20% for Phenix DP, 0% for others.
Paper amount. The portion of a loan that appears on the system's records as disbursed and repaid.
Pathy fine. A fine equal to one daily pathy. Imposed when a customer misses payments per the fine engine rules.
Compound (WB). WB fines escalate over time. Base fine is 10% of weekly interest; after 10 unpaid weeks, the base escalates by 1 unit every 10 weeks.
Three Amigos. (Not used in Loan Manager — this term came up in earlier Dijoy conversations and isn't part of this product.)
NOC. No Objection Certificate. A document traditionally issued when a loan closes. Loan Manager does NOT issue NOCs — closure happens via a text message only.
Rating terms
Excellent / Good / Average / Risky / Defaulter. The five rating tiers, with Excellent at the top and Defaulter at the bottom. Default for new customers: Average.
Rating lock. A flag on a customer that prevents the auto-rating engine from changing their rating. Either owner or clerk can lock; the loan-write-off rule overrides the lock.
Suggestion. A flagged auto-rule proposal in rating_suggestions table. Owner reviews and accepts/dismisses. Most rating rules produce suggestions rather than auto-applying.
Recovery state terms
Healthy. Default state. No fines, no overdue payments.
Watch. Customer has at least one fine.
FollowUp. Customer is meaningfully behind (2+ weeks WB, or 5+ days DP/EL/DB arrears).
Recovery. Customer is far behind; automated reminders suspended; manual outreach only. Rating auto-locked at Risky.
Legal. Owner has decided to pursue formal recovery. Auto-locked at Defaulter.
WrittenOff. Loan written off as a loss. Customer locked at Defaulter.
Technical terms
RLS. Row Level Security — Postgres feature that filters rows per-user based on policies. Used to enforce company isolation.
Server Action. Next.js feature: a server-side function callable from client components, with end-to-end type safety. The primary RPC mechanism in this app.
Server Component. A React component that runs only on the server, never ships JS to the client. Default rendering mode in Next.js App Router.
Audit log. Append-only table recording every state change. Used for trust, recovery, and compliance.
Materialized view. A Postgres view whose results are stored on disk and refreshed periodically. Used for dashboard performance.
Paise. 1/100th of an Indian Rupee. All money is stored as bigint paise. ₹1.00 = 100.
E.164. International phone number format: +<country><number> with no spaces, like +918714578535. Used for storage.
bps. Basis points. 1 bps = 0.01%. Default interest rate 16% = 1600 bps.

