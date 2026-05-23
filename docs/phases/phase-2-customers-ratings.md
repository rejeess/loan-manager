# Phase 2 — Customers, DCS lookup, ratings (manual)

Outcome: Owner and clerk can register customers, look them up by DCS / name / phone, and set/change their rating with notes. Audit trail covers all changes. Auto-rating rules NOT yet implemented (Phase 4).

### Tasks

2.1 Database

Migrations for:

customers

rating_changes

rating_suggestions (table exists; not yet populated)

recovery_state_changes (table exists; default state inferred as healthy)

customer_notes

customer_summary cached table + scheduled refresh function

Indexes (text search, phone lookup, DCS)

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
