# API Contracts

This document describes the server-side surface of Loan Manager: Server Actions, Route Handlers, and Background Job contracts.

The Next.js App Router pattern means most reads and writes are Server Actions (RPC-style), with Route Handlers used only for webhooks, exports, cron triggers, and any third-party integrations. There is no public REST API for this application.

Audience: the developer implementing these endpoints, and any future developer extending them.

## 1. Conventions

Server Action signature

async function actionName(  input: ZodSchemaType): Promise<  | { success: true; data: SuccessShape }  | { success: false; error: { code: string; message: string; details?: unknown } }>

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

Deno.serve(async (req) => {  // Verify cron secret  // Do work  // Return Response})

Error codes

Standardized:

Code

Meaning

validation_failed

Input failed Zod schema

not_found

Entity doesn't exist or authorization blocks access

forbidden

Authenticated but lacks permission

conflict

State conflict (e.g. duplicate DCS)

business_rule_violation

Domain rule blocked the action

external_service_failed

Database/Resend/etc. error

internal_error

Unexpected — log to Sentry

## 2. Authentication actions

Implemented by Better Auth. Listed here for completeness.

signIn

input: { email: string; password: string }output: { success: true; requiresMfa: boolean } | { error }

If requiresMfa, client prompts for TOTP and calls verifyMfa.

verifyMfa

input: { code: string }output: { success: true } | { error }

signOut

input: {}output: { success: true }

inviteClerk (owner only)

input: { email: string; fullName: string; companyId: string }output: { success: true; userId: string } | { error }

Creates account and sends invitation email via Better Auth. Creates row in users and company_memberships (role: 'clerk').

## 3. Company & session actions

getCurrentSession

Returns the authenticated user, their memberships, and the currently selected company.

input: {}output: {  success: true;  data: {    user: { id: string; email: string; fullName: string; preferredLanguage: 'en' | 'ml' };    memberships: { companyId: string; companyName: string; role: 'owner' | 'clerk' }[];    currentCompanyId: string;  }}

switchCompany (owner only)

input: { companyId: string }output: { success: true } | { error: 'forbidden' }

Updates the session's selected company. Query helpers explicitly scope subsequent queries by company_id.

updateProfile

input: { fullName?: string; preferredLanguage?: 'en' | 'ml' }output: { success: true }

updateCompany (owner only)

input: { legalName?: string; address?: string; phone?: string; licenseNumber?: string; termsText?: string; logoFile?: File }output: { success: true }

Updates the current company's record. Logo saved to local file storage (`/uploads`); path stored in companies.logo_path.

## 4. Customer actions

searchCustomers

input: {  query: string;           // DCS, name, or phone fragment  limit?: number;          // default 20  offset?: number;         // for pagination}output: {  success: true;  data: {    customers: CustomerSummary[];    total: number;  }}type CustomerSummary = {  id: string;  dcsNumber: string;  name: string;  phoneE164: string;  area: string | null;  currentRating: 1 | 2 | 3 | 4 | 5;  ratingLocked: boolean;  recoveryState: 'healthy' | 'watch' | 'follow_up' | 'recovery' | 'legal' | 'written_off';  activeLoanCount: number;  totalActivePrincipalPaise: bigint;};

Query strategy:

If query is all digits, try DCS number first, then phone last 4.

Otherwise, full-text search on name.

getCustomer

input: { dcs: string }output: { success: true; data: CustomerDetail } | { error: 'not_found' }type CustomerDetail = CustomerSummary & {  fullAddress: string | null;  idProofType: string | null;  idProofNumber: string | null;  preferredLanguage: 'en' | 'ml';  source: string | null;  initialRating: 1 | 2 | 3 | 4 | 5;  initialRatingNote: string | null;  photoPath: string | null;  createdAt: string;  activeLoans: LoanSummary[];  recentPayments: PaymentSummary[];  notes: CustomerNoteSummary[];  ratingHistory: RatingChangeSummary[];  recoveryHistory: RecoveryStateChangeSummary[];};

createCustomer

input: {  dcsNumber?: string;          // optional: auto-generated if not provided  name: string;  phoneE164: string;  area?: string;  fullAddress?: string;  idProofType?: 'aadhaar' | 'pan' | 'voter' | 'driving_license' | 'other';  idProofNumber?: string;  preferredLanguage: 'en' | 'ml';  source?: string;  initialRating: 1 | 2 | 3 | 4 | 5;  initialRatingNote?: string;  photoFile?: File;}output: { success: true; data: { customerId: string; dcsNumber: string } } | { error }

DCS auto-generation: takes advisory lock on companies.dcs_next_number, increments, returns formatted DCS<n>.

Writes:

customers row.

rating_changes row with source = 'initial', previous_rating = NULL, new_rating = initialRating.

audit_log row.

updateCustomer

input: {  customerId: string;  fields: Partial<{    name: string;    phoneE164: string;    area: string;    fullAddress: string;    idProofType: ...;    idProofNumber: string;    preferredLanguage: 'en' | 'ml';  }>;}output: { success: true } | { error }

Does NOT update rating — see rating actions.

addCustomerNote

input: { customerId: string; note: string; category: 'general' | 'follow_up' | 'conversation' | 'referral' | 'flag' }output: { success: true; data: { noteId: string } }

## 5. Rating actions

changeRating

input: {  customerId: string;  newRating: 1 | 2 | 3 | 4 | 5;  note: string;        // required  setLock?: boolean;   // optional: also set the lock state}output: { success: true } | { error: 'forbidden' | 'business_rule_violation' }

Allowed for both owner and clerk.

source set to 'manual_owner' or 'manual_clerk' based on caller's role.

Writes rating_changes row.

If clerk, sends notification to owner via notification_queue (in-app) + Resend (email).

If note is empty or missing, returns validation_failed.

setRatingLock

input: { customerId: string; locked: boolean; note: string }output: { success: true } | { error }

Updates customers.rating_locked. Logged via audit_log.

acceptRatingSuggestion

input: { suggestionId: string; note?: string }output: { success: true } | { error: 'not_found' | 'conflict' }

Marks suggestion accepted.

Inserts rating_changes row with source = 'suggestion_accepted'.

Audit log.

dismissRatingSuggestion

input: { suggestionId: string; note?: string }output: { success: true } | { error }

listPendingSuggestions

input: {}output: {  success: true;  data: RatingSuggestion[];}type RatingSuggestion = {  id: string;  customerId: string;  customerName: string;  customerDcs: string;  currentRating: number;  suggestedRating: number;  ruleCode: string;  reasonDetail: string;  createdAt: string;};

For dashboard widget.

## 6. Loan actions

createLoan

input: {  customerId: string;  product: 'dp' | 'wb' | 'db' | 'el';  amountPaise: bigint;       // for DP/DB/EL; for WB: derived from unit count  wbUnits?: number;          // for WB only  wbUnitFractionDenominator?: 1 | 2 | 4;  // for WB only  interestRateBps?: number;  // default 1600  startDate?: string;        // ISO date; default today  overrideApprovedNote?: string;  // required when customer is Risky/Defaulter  manualOverrides?: {    paperAmountPaise?: bigint;    cashComponentPaise?: bigint;    firstPathyPaise?: bigint;    dailyPathyPaise?: bigint;    // etc.  };}output: {  success: true;  data: { loanId: string; disbursalBreakdown: DisbursalBreakdown }} | { error }type DisbursalBreakdown = {  amountPaise: bigint;  paperAmountPaise: bigint;  cashComponentPaise: bigint;  firstPathyPaise: bigint | null;  dailyPathyPaise: bigint | null;  weeklyInterestPaise: bigint | null;  dailyInterestPaise: bigint | null;  customerReceivesPaise: bigint;  totalRepayablePaise: bigint;  tenureDays: number | null;};

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

input: {  loanId: string;  amountPaise: bigint;  paymentDate: string;        // ISO date  paymentMethod: 'upi' | 'bank_transfer' | 'adjustment';  referenceNumber: string;    // required  note?: string;}output: {  success: true;  data: {    paymentId: string;    newBalance: LoanBalance;    messagePreview: { en: string; ml: string };  }} | { error }

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

input: {  loanId: string;  finalStatus: 'closed' | 'written_off';  note: string;}output: { success: true } | { error }

Sets loans.status and closed_at.

For written_off: triggers rating auto-rule → Defaulter, locked.

Inserts loan_state_changes.

Audit log.

convertDpToWb (owner only)

input: {  dpLoanId: string;  wbUnits: number;  wbUnitFractionDenominator: 1 | 2 | 4;  startDate?: string;  note: string;}output: { success: true; data: { newWbLoanId: string } } | { error }

Atomic transaction:

Compute DP outstanding.

Close DP loan: status = 'converted', closed_at = now().

Create new WB loan with converted_from_loan_id pointer.

Audit log entries on both.

Queue customer notification.

phenixTopUp (owner only)

input: {  oldLoanId: string;  newAmountPaise: bigint;  note?: string;}output: {  success: true;  data: {    newLoanId: string;    disbursalBreakdown: DisbursalBreakdown;    cashPaidToCustomerPaise: bigint;  }} | { error }

Atomic transaction:

Validate: old loan is Phenix DP, customer has paid ≥ 40 instalments.

Compute outstanding on old loan.

Compute new loan disbursal breakdown.

Compute cash to customer: newLoan.paperAmountPaise - oldLoan.outstandingPaise.

Close old loan as converted.

Create new loan with renewed_from_loan_id.

Audit log entries.

getLoanDetail

input: { loanId: string }output: { success: true; data: LoanDetail } | { error }type LoanDetail = {  // loan fields  ...  customer: CustomerSummary;  balance: LoanBalance;  payments: PaymentSummary[];  fines: FineSummary[];  events: LoanEvent[];   // state changes};type LoanBalance = {  totalPaidPaise: bigint;  totalFinesImposedPaise: bigint;  totalFinesClearedPaise: bigint;  outstandingFinesPaise: bigint;  outstandingPrincipalPaise: bigint;  arrearsPaise: bigint;  daysOrWeeksInArrears: number;  status: 'healthy' | 'watch' | 'follow_up' | 'recovery';};

## 7. Recovery state actions

changeRecoveryState

input: {  customerId: string;  newState: 'recovery' | 'legal' | 'written_off';  note: string;       // required}output: { success: true } | { error: 'forbidden' | 'invalid_transition' }

Owner-only. Validates state transitions per the state machine (§8 business rules).

Auto-rules:

→ recovery triggers rating auto → Risky, locked.

→ legal triggers rating auto → Defaulter, locked.

→ written_off triggers rating auto → Defaulter, locked.

logRecoveryActivity

input: {  customerId: string;  activityType: 'visit' | 'call' | 'message' | 'meeting';  note: string;}output: { success: true }

Inserts a customer_notes row with category = 'conversation' and a structured payload.

## 8. Notification & messaging actions

prepareReminder

input: { loanId: string }output: {  success: true;  data: {    waUrl: string;       // wa.me link with pre-filled message    messageText: string;    customerLanguage: 'en' | 'ml';  }}

Renders the reminder template, encodes it, and returns the wa.me/<phone>?text=... URL.

markReminderSent

input: { notificationQueueId: string }output: { success: true }

Marks a queued notification as sent.

prepareBulkReminders

input: { notificationQueueIds: string[] }output: {  success: true;  data: { items: { id: string; waUrl: string; messageText: string }[] }}

For bulk-send UX.

createCampaign (owner only)

input: {  name: string;  messageTemplateEn: string;  messageTemplateMl: string;  filters: {    ratingTiers?: number[];    productsHistory?: ('dp' | 'wb' | 'db' | 'el')[];    productsActive?: ('dp' | 'wb' | 'db' | 'el')[];    areas?: string[];    minLoansClosed?: number;    excludeRecoveryStates?: ('recovery' | 'legal' | 'written_off')[];    preferredLanguage?: 'en' | 'ml';  };}output: { success: true; data: { campaignId: string; matchedCount: number; breakdown: Breakdown } }type Breakdown = {  byTier: Record<number, number>;  byArea: Record<string, number>;  byLanguage: { en: number; ml: number };};

Status starts as draft.

approveCampaign (owner only)

input: { campaignId: string }output: { success: true; data: { recipientCount: number } }

Inserts campaign_recipients rows for each matched customer.

Sets campaign status to approved.

sendCampaignRecipient

input: { campaignRecipientId: string }output: { success: true; data: { waUrl: string; messageText: string } }

Returns the wa.me URL for the staff to tap. Marks recipient as sent.

## 9. Report & export actions

getDashboardSummary

input: {}output: {  success: true;  data: {    totalActiveLoansPaise: bigint;       // current company    yesterdayDisbursedPaise: bigint;    yesterdayCollectedPaise: bigint;    overdueCount: number;    dueIn10DaysCount: number;    eligibleForRenewalCount: number;    crossingFineThresholdCount: number;    overnightRatingChanges: number;    pendingSuggestionsCount: number;  };}

getLongPendingTracker

input: {  sortBy: 'days_late_desc' | 'amount_desc' | 'rating_asc';  filters?: {    ratingTiers?: number[];    products?: ('dp' | 'wb' | 'db' | 'el')[];    recoveryStates?: string[];  };  limit?: number;  offset?: number;}output: {  success: true;  data: { items: TrackerItem[]; total: number };}type TrackerItem = {  customerId: string;  dcsNumber: string;  customerName: string;  rating: number;  recoveryState: string;  loanId: string;  product: string;  daysOrWeeksLate: number;  arrearsPaise: bigint;  lastContactAt: string | null;  lastContactNote: string | null;};

getDisbursalReport (owner only)

input: { startDate: string; endDate: string; companyId?: string; product?: string }output: {  success: true;  data: { rows: { date: string; product: string; count: number; totalPaise: bigint }[]; grandTotalPaise: bigint };}

getCollectionReport (owner only)

Mirror of disbursal report for payments.

getMonthlyPnl (owner only)

input: { year: number; month: number }output: {  success: true;  data: {    interestEarnedPaise: bigint;    finesCollectedPaise: bigint;    expensesPaise: bigint;    profitEstimatePaise: bigint;    breakdown: { product: string; interestPaise: bigint; finesPaise: bigint }[];  };}

getYearlySummary (owner only)

For GST submission.

input: { financialYear: string }   // e.g. "2025-26"output: {  success: true;  data: { /* shape TBD with accountant in Phase 5 */ };}

exportToExcel

input: {  entity: 'customers' | 'loans' | 'payments' | 'fines' | 'rating_history' | 'audit_log';  filters?: Record<string, unknown>;}output: { success: true; data: { downloadUrl: string } } | { error }

Generates an Excel file via exceljs and saves to local file storage. Returns a download URL.

Owner-only for sensitive entities (payments aggregated income data, audit_log).

## 10. Route Handlers (HTTP endpoints)

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

## 11. Edge Functions

Heavy or external-integration work.

weekly-backup

Connects to owner's Google Drive via OAuth credentials stored in environment variables. Exports each table as Excel, uploads to a dated folder.

kyc-verification (Phase 6)

Wraps the chosen KYC API provider (Cashfree, Karza, or similar). Returns structured verification result.

cibil-check (Phase 6)

Wraps CIBIL API.

## 12. Type sharing

All input/output types live in lib/schemas/ as Zod schemas. The TypeScript types are derived:

// lib/schemas/loans.tsimport { z } from 'zod';export const createLoanInput = z.object({  customerId: z.string().uuid(),  product: z.enum(['dp', 'wb', 'db', 'el']),  amountPaise: z.bigint().positive(),  // ...});export type CreateLoanInput = z.infer<typeof createLoanInput>;

Server Actions:

// app/(app)/loans/actions.ts'use server';import { createLoanInput, CreateLoanInput } from '@/lib/schemas/loans';export async function createLoan(rawInput: unknown) {  const parsed = createLoanInput.safeParse(rawInput);  if (!parsed.success) return { success: false, error: { code: 'validation_failed', ... } };  const input = parsed.data;  // ...}

Client uses the same schema for form validation, gets fully typed inputs/outputs.

## 13. What's NOT in this API

No GraphQL. Server Actions provide RPC-style data access.

No REST endpoints for client consumption. All client-server interaction is Server Actions.

No webhooks (yet). If KYC/CIBIL APIs require webhook callbacks, we'll add Route Handlers in Phase 6.

No SDK or external API. This is an internal application. No third party will call it.
