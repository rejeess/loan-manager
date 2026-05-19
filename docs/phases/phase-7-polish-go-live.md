# Phase 7 — Polish + go-live

Outcome: App is production-ready. 2FA enforced. Offline mode works. Mobile UX is polished. Owner and clerks trained.

### Tasks

7.1 Offline mode

Service worker via Next PWA plugin.

TanStack Query mutation persistence to IndexedDB.

Background sync when reconnected.

Conflict resolution: last-write-wins with audit notes.

7.2 Test mode

Test mode toggle in settings.

Marks the user's session as test; all writes go to a _test schema (or marked rows).

Clear test data button.

7.3 Delete protection (recycle bin)

Soft delete via deleted_at column.

/admin/recycle-bin page.

Restore and permanent delete buttons.

Cron job purges > 30 days.

7.4 Language toggle polish

Ensure all UI strings localized.

Malayalam font rendering check on Android.

7.5 Mobile UX polish

Re-walk every screen on 375px viewport.

PWA manifest, install prompt.

Bottom navigation finalised.

Touch targets ≥ 44px.

7.6 2FA enforcement

Block owner login without 2FA configured.

Backup codes generation.

7.7 Weekly Google Drive backup

Edge function with Drive API OAuth.

Owner connects their Drive in settings.

First backup runs manually; cron continues.

7.8 Training materials

Two short videos (one English, one Malayalam): "Add a customer & record a payment" + "Sending reminders".

One-page printed cheat sheets for clerks.

7.9 Go-live runbook

Pre-launch checklist.

Launch-day script.

Rollback plan.

### Definition of Done

☐ App works offline; payments queued and synced.

☐ Test mode is usable for clerk training.

☐ Delete protection works end to end.

☐ 2FA mandatory for owner; works on first login.

☐ Weekly backup uploads to owner's Google Drive.

☐ Owner and at least one clerk trained.

☐ Production cutover complete.

Velocity assumptions and risk

15 hours/week of focused development time.

~3 hours/week swallowed by debugging, deploys, doc updates.

Effective: ~12 hours/week building features.

Risks

Domain rules ambiguity surfacing during build — partially mitigated by the spec, but expect 2–3 owner conversations per phase. Budget 1 hour/week for this.

Offline mode being harder than estimated — Phase 7 may slip 1 weekend. Acceptable.

KYC/CIBIL integration friction — third-party APIs are unpredictable. Defer to post-launch if it blocks anything.

Performance issues at scale — likely none at ~150 active loans. Monitor and address only when concrete.

What to cut if running over

If schedule slips:

Defer KYC/CIBIL integrations to post-launch.

Defer Online payment collection (UPI links).

Defer multi-branch readiness (add later when needed).

Defer test mode (offline mode is more important).

Last to cut: offline mode (operationally important in Kerala connectivity).

Never cut: audit log, 2FA, RLS policies, backup. These are non-negotiable for trust.

After launch

Month 1: monitor closely. Daily check-ins with owner. Fix issues fast.

Month 2: observation and small enhancements.

Month 3: post-launch review. What's working, what isn't. Plan next quarter.

Beyond: the app is in steady state. Maintenance + minor enhancements only. Major features (a third company, branches, multi-product offers) considered case by case.
