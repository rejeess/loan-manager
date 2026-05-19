# Data Model

Full Postgres schema for Loan Manager. Read architecture-hld.md (see Architecture Hld) § 4 first for principles (bigint paise, RLS, audit log, event-sourced derivations).

This document is the authoritative schema reference. Migrations in supabase/migrations/ must match this document. When they diverge, this document is updated in the same PR.

## 1. Entity-relationship overview

[ Entity-Relationship Diagram — renders natively in the GitHub repo / Markdown viewer ]

erDiagram  companies ||--o{ company_memberships : "has"  users ||--o{ company_memberships : "has"  companies ||--o{ customers : "has"  customers ||--o{ loans : "takes"  loans ||--o{ payments : "receives"  loans ||--o{ fines : "incurs"  customers ||--o{ rating_changes : "history"  customers ||--o{ rating_suggestions : "pending"  customers ||--o{ recovery_state_changes : "history"  customers ||--o{ customer_notes : "has"  loans ||--o{ loan_state_changes : "history"  companies ||--o{ campaigns : "has"  campaigns ||--o{ campaign_recipients : "has"  customers ||--o{ campaign_recipients : "appears in"  companies ||--o{ notification_queue : "has"  users ||--o{ audit_log : "actor"  companies {    uuid id PK    text name    text legal_name    text address    text phone    text license_number    text logo_path    text terms_text    bigint dcs_next_number    timestamptz created_at  }  users {    uuid id PK    text email    text full_name    text preferred_language    timestamptz created_at  }  company_memberships {    uuid id PK    uuid user_id FK    uuid company_id FK    text role    boolean active    timestamptz created_at  }  customers {    uuid id PK    uuid company_id FK    text dcs_number    text name    text phone_e164    text area    text full_address    text id_proof_type    text id_proof_number    text photo_path    text preferred_language    text source    boolean rating_locked    int initial_rating    text initial_rating_note    timestamptz created_at  }  loans {    uuid id PK    uuid customer_id FK    uuid company_id FK    text product    bigint amount_paise    bigint paper_amount_paise    bigint cash_component_paise    bigint first_pathy_paise    bigint daily_pathy_paise    int tenure_days    int interest_rate_bps    date start_date    text status    uuid renewed_from_loan_id FK    uuid converted_from_loan_id FK    timestamptz created_at  }  payments {    uuid id PK    uuid loan_id FK    uuid company_id FK    bigint amount_paise    date payment_date    text payment_method    text reference_number    text note    uuid recorded_by FK    timestamptz created_at  }  fines {    uuid id PK    uuid loan_id FK    uuid company_id FK    bigint amount_paise    text reason_code    text reason_detail    date imposed_date    bigint cleared_amount_paise    timestamptz created_at  }  rating_changes {    uuid id PK    uuid customer_id FK    uuid company_id FK    int previous_rating    int new_rating    text source    text rule_code    uuid changed_by FK    text note    boolean locked_after    timestamptz created_at  }  rating_suggestions {    uuid id PK    uuid customer_id FK    uuid company_id FK    int suggested_rating    text rule_code    text reason_detail    text status    uuid resolved_by FK    text resolution_note    timestamptz created_at    timestamptz resolved_at  }  recovery_state_changes {    uuid id PK    uuid customer_id FK    uuid company_id FK    text previous_state    text new_state    uuid changed_by FK    text note    timestamptz created_at  }  customer_notes {    uuid id PK    uuid customer_id FK    uuid company_id FK    text note    text category    uuid created_by FK    timestamptz created_at  }  loan_state_changes {    uuid id PK    uuid loan_id FK    text previous_status    text new_status    uuid changed_by FK    text note    timestamptz created_at  }  campaigns {    uuid id PK    uuid company_id FK    text name    text message_template_en    text message_template_ml    jsonb filters    text status    uuid created_by FK    uuid approved_by FK    timestamptz created_at    timestamptz approved_at  }  campaign_recipients {    uuid id PK    uuid campaign_id FK    uuid customer_id FK    text status    timestamptz sent_at    uuid sent_by FK  }  notification_queue {    uuid id PK    uuid company_id FK    uuid customer_id FK    uuid loan_id FK    text type    text payload_en    text payload_ml    text status    timestamptz scheduled_for    timestamptz sent_at    uuid sent_by FK  }  audit_log {    uuid id PK    uuid company_id FK    uuid actor_id FK    text actor_role    text entity_type    uuid entity_id    text action    jsonb before    jsonb after    text note    timestamptz created_at  }

## 2. Tables

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

INSERT INTO companies (name, dcs_next_number) VALUES  ('Jeevana Loans', 111),  ('Phenix Money & More', 1239);

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

## 3. Views

customer_summary

The DCS lookup screen and customer list use this. Refreshed every 5 minutes (materialised view) for dashboard performance; live components query the underlying tables for accuracy.

CREATE MATERIALIZED VIEW customer_summary ASSELECT  c.id AS customer_id,  c.company_id,  c.dcs_number,  c.name,  c.phone_e164,  c.area,  c.preferred_language,  c.rating_locked,  -- Current rating  COALESCE(    (SELECT new_rating FROM rating_changes     WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1),    c.initial_rating  ) AS current_rating,  -- Current recovery state  COALESCE(    (SELECT new_state FROM recovery_state_changes     WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1),    'healthy'  ) AS recovery_state,  -- Active loan summary  (SELECT COUNT(*) FROM loans   WHERE customer_id = c.id AND status = 'active') AS active_loan_count,  (SELECT COALESCE(SUM(amount_paise), 0) FROM loans   WHERE customer_id = c.id AND status = 'active') AS total_active_principal_paiseFROM customers c;

A live (non-materialised) version with the same columns exists for the customer detail view, where staleness is unacceptable.

loan_balance

Computes current outstanding for a loan from its payments and fines. Implemented as a SQL function:

CREATE OR REPLACE FUNCTION loan_balance(p_loan_id uuid)RETURNS TABLE (  total_paid_paise bigint,  total_fines_paise bigint,  fines_cleared_paise bigint,  outstanding_principal_paise bigint) AS $$  -- Implementation in business-rules.md §3$$ LANGUAGE plpgsql STABLE;

Details in business-rules.md (see Business Rules).

## 4. Row Level Security policies

RLS is enabled on every table. Policies enforce:

Companies/users/memberships: only readable by users with at least one membership in the affected company.

All other tables: filtered by company_id matching one of the user's active memberships.

Owner-only data: profit, P&L queries route through a security-definer function checking role = 'owner'.

Helper: current_user_company_ids()

CREATE OR REPLACE FUNCTION current_user_company_ids()RETURNS SETOF uuid AS $$  SELECT company_id FROM company_memberships  WHERE user_id = auth.uid() AND active = true;$$ LANGUAGE sql STABLE SECURITY DEFINER;

Helper: current_user_role(p_company_id uuid)

CREATE OR REPLACE FUNCTION current_user_role(p_company_id uuid)RETURNS text AS $$  SELECT role FROM company_memberships  WHERE user_id = auth.uid() AND company_id = p_company_id AND active = true  LIMIT 1;$$ LANGUAGE sql STABLE SECURITY DEFINER;

Policy patterns

Read access on domain tables:

CREATE POLICY "members_can_read"  ON customers FOR SELECT  USING (company_id IN (SELECT current_user_company_ids()));

Write access — owner or clerk:

CREATE POLICY "members_can_insert"  ON customers FOR INSERT  WITH CHECK (company_id IN (SELECT current_user_company_ids()));

Owner-only writes (settings, role changes):

CREATE POLICY "owner_only_update"  ON companies FOR UPDATE  USING (current_user_role(id) = 'owner');

Clerks can't read income data: P&L queries route through a security-definer function that explicitly checks the caller's role.

Specific policies are written in migrations. The above patterns apply to most tables.

## 5. Key invariants

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

## 6. Migration strategy

Migrations in supabase/migrations/<timestamp>_<name>.sql.

Forward-only — never edit a migration that has been merged.

New columns: add as nullable, backfill, then add NOT NULL constraint in a follow-up migration if needed.

Renaming columns: add new column, sync writes, migrate reads, drop old column.

Always include the corresponding RLS policy in the same migration as the table.

## 7. Seed data

Required at first boot:

companies rows for Jeevana and Phenix.

A default owner user (created via Supabase Auth, then row in users and company_memberships for both companies).

A test mode companies row tagged is_test = true (Phase 7 — not at launch).

Sample customers/loans for development environment only. Never in production.

Seed lives in supabase/seed.sql and runs after supabase reset.

## 8. Backup and recovery

Supabase takes automatic daily Postgres backups, retained 30 days.

Weekly export via Edge Function to owner's Google Drive: full schema dump + Excel exports of each table.

Restore procedure documented in docs/runbook-restore.md (created during Phase 1).

## 9. Indexing strategy

Beyond the indexes called out per table:

Composite index (company_id, created_at) on all major tables for paginated reads.

Partial index on loans where status = 'active' — most queries filter by active.

GIN index on customers.name via tsvector('simple', name) for full-text search.

B-tree on customers.phone_e164 (last-4 search uses LIKE with index hint).

Review query performance at the end of Phase 3 and add indexes based on actual slow queries, not speculation.
