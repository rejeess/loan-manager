# Phase 3 — Loans + payments

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
