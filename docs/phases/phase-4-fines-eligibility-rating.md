# Phase 4 — Fines, eligibility, rating engine

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
