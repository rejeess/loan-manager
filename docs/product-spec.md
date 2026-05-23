# Product Specification

Loan Manager — locked product requirements

This document describes what the system does. For how it's built, see architecture-hld.md (see Architecture Hld). For business-rule depth (interest math, fine compounding, rating engine), see business-rules.md (see Business Rules).

## 1. What we're building

A private web application that runs on phone, tablet, or laptop. Used by the owner and clerks of two finance companies in Kerala:

Jeevana Loans

Phenix Money & More (Friends Mall Business Arcade, 2nd Floor, Suite 36/6108, Shornur Road – 680022, +91 8714 57 8535)

The system is multi-company from day one. Owner can switch between Jeevana and Phenix and see each company's loans, customers, and reports separately. No shared customer pool — each company has its own ledger.

Customers do not log in. They receive WhatsApp/SMS messages from the system.

### Not in scope

Public access of any kind

Customer money transfers (the app is informational; payments still happen via UPI/bank)

Any government system integrations (GST, KYC reporting, etc.)

Replacing the accountant (but it produces reports they can use)

Native mobile apps (it's a Progressive Web App installable from the website)

## 2. Users and roles

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

## 3. Companies and products

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

## 4. Customer rating system

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

## 5. DCS — customer master view

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

## 6. Daily operations

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

## 7. Reminders and customer messages

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

## 8. Owner dashboard and reports

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

## 9. Safety, trust, and data ownership

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

## 10. Internationalisation

Both English and Malayalam supported.

Staff choose their language on login; persists across sessions.

Each customer has a preferred language stored; messages go in that language.

All UI strings, message templates, and PDFs (none currently, but in case we add later) localised.

## 11. Other features confirmed

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

## 12. What is NOT being built

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

## 13. Operating constraints

Realistic monthly running cost: ₹0 to ₹100 at current scale. ₹2,000/month at 1,000+ active loans.

No software licences. No app store fees. No per-user fees. Hosted on Vercel free tier until scale demands an upgrade. SQLite storage is free.

Browser support: Chrome, Safari, Edge on iOS 16+, Android 11+, recent desktop browsers.

Network: must work on slow 4G. Should degrade gracefully to offline mode when connectivity is intermittent.

## 14. Firm details (for receipts and messages)

Phenix Money & More

Address: Friends Mall Business Arcade, 2nd Floor, Suite No. 36/6108, Shornur Road – 680022

Phone: +91 8714 57 8535

Logo: provided (assets/phenix-logo.png)

Full legal name, license/registration number, T&Cs text: TBD before Phase 6.

Jeevana Loans

Full details: TBD before Phase 6.

These don't block Phase 1–5. Required before Phase 6 (reminders and customer messages with branded content).
