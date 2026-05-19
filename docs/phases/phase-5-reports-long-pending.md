# Phase 5 — Reports + long-pending tracker

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
