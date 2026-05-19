# Phase 1 — Foundation

Outcome: Owner and clerk can log in. Owner can switch between Jeevana and Phenix. Sidebar navigation works. Empty dashboard shows.

### Tasks

1.1 Database — base tables

Migrations:

companies (seeded with Jeevana, Phenix)

users

company_memberships

audit_log

Helper functions: current_user_company_ids(), current_user_role()

RLS policies on the above.

1.2 Auth flows

/login page (email + password).

2FA setup flow for owners (TOTP, stored in Supabase Auth).

2FA challenge on login when configured.

/forgot-password flow.

Middleware redirecting unauthenticated users to login.

Server Actions: signIn, verifyMfa, signOut.

1.3 Layout shell

App shell with left sidebar (collapsible on mobile).

Top bar with company switcher (visible only if user has membership in multiple companies — i.e. only owner).

User menu (profile, language, sign out).

Bottom navigation on mobile.

Empty placeholder pages for: Dashboard, Customers, Loans, Payments, Reports, Messages, Settings.

1.4 Company management

Owner-only /settings/company page.

Form to edit company details (legal name, address, phone, license, T&Cs, logo).

Logo upload to Supabase Storage.

1.5 User management

Owner-only /admin/users page.

List of users + memberships.

Invite clerk (form: email, full name, company). Sends Supabase Auth invite.

Deactivate / reactivate clerk.

1.6 Audit log viewer

Owner-only /admin/audit-log page.

Filterable table of audit log entries.

### Definition of Done

☐ Two seed users exist: owner (with both memberships) and clerk-jeevana.

☐ Owner logs in, sees both companies in switcher.

☐ Clerk logs in, sees only their assigned company.

☐ Owner can switch companies; UI updates correctly.

☐ Owner can edit company details and upload logos.

☐ Owner can invite a new clerk; email is received.

☐ Audit log records the company-switch and any setting changes.

☐ 2FA setup works for owner; can't bypass it on login.

☐ Mobile layout is usable (375px wide).

☐ All Playwright E2E tests pass for: login, login with 2FA, switch company, invite clerk.
