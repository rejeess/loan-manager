# Phase 0 — Project setup

Outcome: Empty Next.js app deployed to production. Local dev environment working. Repo, CI, monitoring live.

### Tasks

Create GitHub repo loan-manager (private).

Bootstrap: pnpm create next-app@latest loan-manager --typescript --tailwind --app --src-dir --use-pnpm.

Install shadcn/ui base components: pnpm dlx shadcn@latest init and add button, input, form, table, dialog, select, dropdown-menu, card, badge, tabs.

Configure ESLint strict, Prettier, TypeScript strict.

Create Supabase project (Singapore region). Save URL + anon key.

Connect repo to Vercel. Set env vars. Deploy main.

Install Supabase CLI locally. supabase init. supabase start works locally.

Set up GitHub Actions: lint + typecheck + build on every PR.

Set up Sentry. Add to error boundary.

Create CLAUDE.md in repo root (template provided separately).

Create docs/ folder; commit all the spec docs.

Set up Playwright for E2E. Smoke test: / returns 200.

### Definition of Done

☐ Production URL serves a placeholder "Loan Manager" page.

☐ Localhost runs the app and local Supabase together.

☐ PR opens a preview deployment.

☐ CI passes lint, typecheck, build.

☐ Sentry receives a test error.

☐ All spec docs in /docs on main.
