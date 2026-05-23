# Phase 0 — Project setup

Outcome: Empty Next.js app deployed to production. Local dev environment working. Repo, CI, monitoring live.

### Tasks

Create GitHub repo loan-manager (private).

Bootstrap: pnpm create next-app@latest loan-manager --typescript --tailwind --app --src-dir --use-pnpm.

Install shadcn/ui base components: pnpm dlx shadcn@latest init and add button, input, form, table, dialog, select, dropdown-menu, card, badge, tabs.

Configure ESLint strict, Prettier, TypeScript strict.

Install Drizzle ORM and Better Auth packages (`bun add`). Set up `drizzle/schema.ts` and `lib/auth.ts`.

Connect repo to Vercel. Set env vars (DATABASE_URL, BETTER_AUTH_SECRET). Deploy main.

Run `bunx drizzle-kit generate` and `bunx drizzle-kit migrate` to create the local SQLite database.

Set up GitHub Actions: lint + typecheck + build on every PR.

Set up Sentry. Add to error boundary.

Create CLAUDE.md in repo root (template provided separately).

Create docs/ folder; commit all the spec docs.

Set up Playwright for E2E. Smoke test: / returns 200.

### Definition of Done

☐ Production URL serves a placeholder "Loan Manager" page.

☐ Localhost runs the app with a local SQLite database.

☐ PR opens a preview deployment.

☐ CI passes lint, typecheck, build.

☐ Sentry receives a test error.

☐ All spec docs in /docs on main.
