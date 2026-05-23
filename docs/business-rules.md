# Business Rules

The gnarly product logic for Loan Manager — interest calculations, fine engines per product, rating rules, eligibility progressions, and the recovery state machine.

This is the implementation specification for everything in lib/domain/. Each section maps to a TypeScript module.

Convention: All amounts in this document are in paise (bigint) unless explicitly noted. ₹1.00 = 100 paise. Interest rates in basis points (1% = 100 bps).

## 1. Loan products — quick reference

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

## 2. Disbursal math

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

## 3. Loan balance computation

Implemented as a function in lib/domain/balance.ts and (optionally) as a SQL view for efficient queries.

DP loans

expected_paid_to_date = MIN(elapsed_days, tenure_days) × daily_pathytotal_paid = SUM(payments.amount_paise)total_fines_imposed = SUM(fines.amount_paise)total_fines_cleared = SUM(fines.cleared_amount_paise)outstanding_fines = total_fines_imposed - total_fines_clearedbalance = (tenure_days × daily_pathy) - total_paid + outstanding_finesarrears = MAX(0, expected_paid_to_date - total_paid)days_in_arrears = arrears / daily_pathy (rounded up)

When balance = 0 and no outstanding fines and elapsed_days >= tenure_days, the loan is eligible for closed status.

WB loans

WB loans have no fixed end. Balance is tracked as:

weeks_elapsed = floor((today - start_date) / 7)expected_interest_payments = weeks_elapsed × weekly_interest(The first week's interest was kept upfront, so the customer is expected to make payments starting week 2.)expected_total_paid_to_date = MAX(0, (weeks_elapsed - 1)) × weekly_interesttotal_interest_paid = SUM(payments.amount_paise) — assuming all payments are interestarrears = MAX(0, expected_total_paid_to_date - total_interest_paid)weeks_in_arrears = arrears / weekly_interestprincipal_outstanding = paper_amount + outstanding_fines  // principal never reduces unless customer closes

To close a WB loan, customer pays principal_outstanding + any pending fines. Loan closes with status closed.

DB / EL loans

Same pattern as WB but with daily granularity instead of weekly:

days_elapsed = today - start_date  // DB Jeevana day-1 = disbursal day; EL Phenix day-1 = next dayexpected_total_paid_to_date = days_elapsed × daily_interest  // for DBexpected_total_paid_to_date = MAX(0, days_elapsed - 1) × daily_interest  // for EL (day-1 deducted upfront)arrears = MAX(0, expected_total_paid_to_date - total_paid)days_in_arrears = arrears / daily_interest

To close: customer pays paper_amount + outstanding fines + any pending interest.

Payment allocation

When a payment is recorded, the system allocates in this order (most-to-least priority):

Oldest unfined arrears (the missed pathies for DP; missed interest for WB/DB/EL).

Oldest outstanding fines.

Current period dues.

Future dues (treated as advance payment — flagged for owner to confirm).

Allocation is computed at query time from event tables — we don't store "this payment paid off fine X". The allocation order determines what's considered "cleared" in reports.

For Phase 1–3, simplify: a payment is just an event reducing total balance. Detailed allocation can come later if needed for reports.

## 4. Fine engine

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

unpaid_weeks = weeks_in_arrearsif unpaid_weeks == 0:  no fineelif unpaid_weeks == 1:  no fine (grace period)elif unpaid_weeks <= 10:  fine_this_week = 10% × weekly_interest_for_1_unit × loan_unitselse:  // After week 10, the fine base escalates by 1 unit every 10 weeks  escalation_tier = floor((unpaid_weeks - 1) / 10)   // tier 0 for weeks 1-10, tier 1 for 11-20, etc.  fine_base_units = loan_units × (1 + escalation_tier)  fine_this_week = 10% × weekly_interest_per_unit × fine_base_units

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

## 5. Eligibility engine

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

## 6. Rating engine

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

## 7. Reminder engine

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

## 8. Recovery state machine

Implemented in lib/domain/recovery.ts. Tracks each customer's recovery state independently of their loans.

States

[ State Machine — renders natively in the GitHub repo / Markdown viewer ]

stateDiagram-v2  [*] --> Healthy  Healthy --> Watch : 1 fine imposed  Watch --> Healthy : All fines cleared  Watch --> FollowUp : 2+ weeks unpaid (WB) OR 5+ days arrears (DP/EL/DB)  FollowUp --> Watch : Significant payment, arrears reduced  FollowUp --> Healthy : All caught up  FollowUp --> Recovery : 8+ weeks unpaid (WB) OR 21+ days arrears (DP/EL/DB)  Recovery --> FollowUp : Customer engaging + paying  Recovery --> Legal : Owner manually moves  Recovery --> WrittenOff : Owner manually moves  Legal --> WrittenOff : Owner manually moves  Legal --> Recovery : Settlement, owner manually moves back  WrittenOff --> [*]

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

## 9. DP → WB conversion

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

## 10. Campaign / marketing logic

Targeting filters

A campaign's filters JSON supports:

{  "rating_tiers": [4, 5],         // any of these tiers  "products_history": ["wb"],     // customer has had any loan of these products  "products_active": ["dp"],      // customer currently has an active loan of these products  "areas": ["Shornur", "Thrissur"],  // by customer.area  "min_loans_closed": 3,          // customer has closed at least N loans  "exclude_recovery_states": ["recovery", "legal", "written_off"],  // skip these states  "preferred_language": "ml"      // optional}

Defaulters are not auto-excluded. Owner can include them by leaving exclude_recovery_states empty.

Preview and approval

When owner clicks "Preview":

System runs the filter, returns a list of matching customers with rating, recovery state, language, last contact date.

Shows count breakdowns by tier, area, language.

Owner reviews and either approves (status → approved) or makes changes.

Sending

On approval, system creates campaign_recipients rows for each matched customer. Status starts as pending. Staff sees a "Send Campaign Messages" screen and taps through.

## 11. Audit log invariants

Every domain write must produce an audit log entry. Rules:

One transaction = one audit log row for the primary action. Cascading changes (e.g. rating change triggered by manual loan write-off) can produce additional rows in the same transaction.

Action codes: created, updated, deleted, state_changed, rating_changed, payment_recorded, fine_imposed, loan_disbursed, loan_closed, loan_converted, loan_written_off, suggestion_resolved, campaign_approved, etc.

Before/after JSON: for updated, capture only changed fields. For created, before is null and after is the full row. For deleted, after is null.

Actor: the authenticated user. For system actions (cron jobs), actor_id = null and actor_role = 'system'.

Note: the user-supplied reason text, or for system actions, the rule code.

A utility withAudit(tx, ...) in lib/audit/ enforces this. All Server Actions must use it.

## 12. Open items for confirmation during build

Things the developer should check with the owner during Phase 3 build:

Jeevana DP first-day cash reconciliation (§2). The math suggested by the owner (₹89K to customer + ₹6K separate channel + ₹1K first pathy = ₹96K, not ₹100K) doesn't fully balance to the loan total. May be a description simplification, or there's a ₹4K/₹6K nuance the build should surface. Use the deterministic formula and confirm with owner on first DP creation.

DP fine triggers — exclusive vs. cumulative (§4). Currently spec assumes "only the most severe applies." Owner's v3 answer "1 PB = 1 fine, 2 PB = 2 fine" addresses cross-loan cumulation but not within-loan. Confirm during Phase 4 fine engine build.

WB compound reset details (§4). After customer pays everything, fine base resets to 1 unit. But does the customer need to also pay a "re-entry" penalty? Confirm during Phase 4.

DB amounts — strict tiers or flexible? (§2). Spec says exactly {50K, 75K, 1L, 2L}. Confirm if owner ever does ₹1.5L for example.

Recovery state thresholds (§8). The day/week thresholds for Watch → FollowUp → Recovery are derived from spec discussions. Confirm during Phase 5.

Reminder time-of-day windowing. Spec says 9 AM – 7 PM. Implementation can either send reminders at any time within window, or batch them into morning push (08:00) and let staff send through the day. Default: morning batch, send-through-the-day model.

Festival greeting calendar. Onam, Vishu, Eid, Christmas dates change yearly. Configure as a holiday_calendar table (low priority, Phase 6).

These don't block design. Document the decision and move on.
