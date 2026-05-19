# Phase 6 — Reminders, messages, campaigns

Outcome: Customer messaging works end to end. Reminders queued daily, staff taps to send. Festival greetings, payment confirmations, campaigns.

### Tasks

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

### Definition of Done

☐ Daily reminder cron queues reminders accurately.

☐ Owner / clerk can send reminders in 2 taps.

☐ Festival greeting sends with branded image.

☐ Campaign filtering produces correct recipient lists.

☐ Defaulters not auto-excluded; owner picks per campaign.
