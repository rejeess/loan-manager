# Glossary

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

Authorization. Application-level access control enforced in Server Actions and middleware. Checks the authenticated user's company memberships before allowing reads or writes.

Server Action. Next.js feature: a server-side function callable from client components, with end-to-end type safety. The primary RPC mechanism in this app.

Server Component. A React component that runs only on the server, never ships JS to the client. Default rendering mode in Next.js App Router.

Audit log. Append-only table recording every state change. Used for trust, recovery, and compliance.

Customer summary cache. A database table storing pre-computed customer summary data, refreshed periodically by the nightly cron job. Used for dashboard performance. SQLite does not support materialized views natively.

Paise. 1/100th of an Indian Rupee. All money is stored as bigint paise. ₹1.00 = 100.

E.164. International phone number format: +<country><number> with no spaces, like +918714578535. Used for storage.

bps. Basis points. 1 bps = 0.01%. Default interest rate 16% = 1600 bps.
